// Fixed, redacted failure metadata shared by the native backend and engine.
import { fileURLToPath } from "node:url";
import { types } from "node:util";

export type MaintenanceFailurePhase = "input" | "open" | "prepare" | "apply" | "receipt" | "output" | "close";
export interface MaintenanceFailureDetails {
  phase: MaintenanceFailurePhase;
  kind: "native-maintenance-failure";
  code?: string;
  sources: { module: string; line: number; column: number }[];
}

const codes = new Set([
  "ERR_SQLITE_ERROR", "ERR_INVALID_STATE", "SQLITE_BUSY", "SQLITE_LOCKED",
  "SQLITE_CORRUPT", "SQLITE_NOTADB", "GSD_STALE_STATE", "EACCES", "EPERM", "ENOENT", "EIO", "ENOSPC", "ABORT_ERR",
]);
// Exact package-owned locations, not suffix matches against arbitrary stack paths.
const modules = [
  "../../coordination-maintenance-backend",
  "../extensions/gsd/db/engine", "../extensions/gsd/db/domain-operation",
  "../extensions/gsd/db-provider", "../extensions/gsd/db-adapter",
] as const;
const locations = modules.flatMap(module => ["ts", "js"].map(extension => {
  const url = new URL(`${module}.${extension}`, import.meta.url);
  return { url: url.href, path: fileURLToPath(url), module: `${module.replace(/^(\.\.\/)+/, "")}.${extension}` };
}));
const nativeStackGetter = Object.getOwnPropertyDescriptor(new Error(), "stack")?.get;

/** Never serialize messages, causes, arbitrary codes, function names or raw stacks. */
export function maintenanceFailureDetails(phase: MaintenanceFailurePhase, error: unknown): MaintenanceFailureDetails {
  const details: MaintenanceFailureDetails = { phase, kind: "native-maintenance-failure", sources: [] };
  try {
    if (!types.isNativeError(error)) return details;
    const code = Object.getOwnPropertyDescriptor(error, "code");
    if (code && "value" in code && typeof code.value === "string" && codes.has(code.value)) details.code = code.value;
    const descriptor = Object.getOwnPropertyDescriptor(error, "stack");
    // Node 24 uses an intrinsic accessor; never invoke a caller-supplied getter.
    const stack = descriptor && "value" in descriptor ? descriptor.value
      : descriptor?.get && descriptor.get === nativeStackGetter ? descriptor.get.call(error) : undefined;
    if (typeof stack !== "string") return details;
    // Skip the message line. Bound both parsing work and emitted coordinates.
    for (const frame of stack.slice(0, 16_384).split("\n").slice(1, 33)) {
      if (details.sources.length === 3) break;
      const match = /^\s+at (?:[^\n]* \()?(.+):(\d{1,7}):(\d{1,7})\)?$/.exec(frame);
      if (!match) continue;
      const owned = locations.find(location => match[1] === location.path || match[1] === location.url);
      const line = Number(match[2]);
      const column = Number(match[3]);
      if (owned && line > 0 && line <= 1_000_000 && column > 0 && column <= 1_000_000) {
        details.sources.push({ module: owned.module, line, column });
      }
    }
  } catch { /* Diagnostic collection must not replace the original refusal. */ }
  return details;
}
