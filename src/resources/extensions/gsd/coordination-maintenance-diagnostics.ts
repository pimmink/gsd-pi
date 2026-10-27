/** Diagnostics contain only fixed labels, approved codes and owned source locations.
 * Never return exception messages, SQL, parameters, paths, payloads or causes.
 * Own data descriptors and the captured native stack getter avoid invoking
 * arbitrary exception getters (Node 24 represents Error.stack as an accessor).
 */
export type CoordinationMaintenancePhase = "host-check" | "prepare" | "apply" | "receipt";

const nativeStackGetter = Object.getOwnPropertyDescriptor(new Error(), "stack")?.get;

const approvedCodes = new Set([
  "GSD_REVISION_CONFLICT", "GSD_LIFECYCLE_COVERAGE_REQUIRED",
  "ERR_SQLITE_ERROR", "SQLITE_ERROR", "SQLITE_BUSY", "SQLITE_LOCKED",
  "SQLITE_CONSTRAINT", "SQLITE_CONSTRAINT_TRIGGER", "SQLITE_CONSTRAINT_CHECK",
  "SQLITE_CONSTRAINT_FOREIGNKEY", "SQLITE_CONSTRAINT_NOTNULL", "SQLITE_CONSTRAINT_UNIQUE",
]);
const messageKinds: readonly (readonly [string, string])[] = [
  ["foreign key constraint failed", "sqlite-foreign-key"],
  ["unique constraint failed", "sqlite-unique"],
  ["not null constraint failed", "sqlite-not-null"],
  ["check constraint failed", "sqlite-check"],
  ["cannot start a transaction within a transaction", "sqlite-transaction-state"],
  ["database is locked", "sqlite-busy"],
  ["no such table", "sqlite-missing-table"],
  ["no such column", "sqlite-missing-column"],
  ["is not a function", "call-target-missing"],
  ["no database open", "database-unavailable"],
];

function ownData(error: unknown, key: string): unknown {
  if ((typeof error !== "object" && typeof error !== "function") || error === null) return undefined;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, key);
    return descriptor && "value" in descriptor ? descriptor.value : undefined;
  } catch { return undefined; }
}

function ownStack(error: unknown): unknown {
  const data = ownData(error, "stack");
  if (typeof data === "string") return data;
  if (typeof error !== "object" || error === null || !nativeStackGetter) return undefined;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "stack");
    return descriptor?.get === nativeStackGetter ? Reflect.apply(nativeStackGetter, error, []) : undefined;
  } catch { return undefined; }
}

export function describeCoordinationMaintenanceFailure(error: unknown, phase: CoordinationMaintenancePhase) {
  const message = ownData(error, "message");
  const code = ownData(error, "code");
  const stack = ownStack(error);
  const lower = typeof message === "string" ? message.slice(0, 16384).toLowerCase() : "";
  const kind = messageKinds.find(([needle]) => lower.includes(needle))?.[1] ?? "unclassified";
  const frames: { module: string; line: number; column: number }[] = [];
  if (typeof stack === "string") {
    // Ignore the message line. Emit only these static owned module labels;
    // never copy a raw stack line, full path or function name.
    for (const frame of stack.slice(0, 32768).split("\n").slice(1)) {
      if (!frame.startsWith("    at ")) continue;
      const match = /\/extensions\/gsd\/(db\/engine|db\/domain-operation|db\/adapter|db\/adapter-rust|coordination-maintenance)\.(?:ts|js):(\d{1,7}):(\d{1,7})\)?$/.exec(frame);
      if (!match) continue;
      const line = Number(match[2]);
      const column = Number(match[3]);
      if (line > 0 && column > 0) frames.push({ module: match[1], line, column });
      if (frames.length === 4) break;
    }
  }
  return {
    phase,
    kind,
    ...(typeof code === "string" && approvedCodes.has(code) ? { code } : {}),
    frames,
  };
}
