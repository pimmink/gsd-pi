// Project/App: gsd-pi
// File Purpose: Read-only cutover diagnostic capability; never enters the workflow database engine.

import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { hostname } from "node:os";
import { isAbsolute, join } from "node:path";
import { Type } from "@gsd/pi-ai";
import type { ExtensionAPI } from "@gsd/pi-coding-agent";
import { inspectSqliteReadOnlySnapshot } from "./sqlite-readonly.js";
import { inspectCutoverCoordination, type CoordinationObservations, type PidObservation } from "./cutover-coordination-inspection.js";

/** Signal zero only. Presence/permission is not evidence of the original worker's identity. */
export function observeLocalPid(pid: number, signalZero: (pid: number, signal: 0) => unknown = process.kill): PidObservation {
  if (!Number.isSafeInteger(pid) || pid <= 0 || pid > 2147483647) return "unknown";
  try {
    signalZero(pid, 0);
    return "present";
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    return code === "ESRCH" ? "absent-at-probe" : code === "EPERM" ? "permission-denied" : "unknown";
  }
}

export function readCutoverCoordination(input: unknown, observations?: CoordinationObservations) {
  const request = input && typeof input === "object" ? input as { cwd?: unknown; limit?: unknown } : {};
  const failure = (error: string) => ({ operation: "authority_cutover_coordination" as const, error });
  if (typeof request.cwd !== "string" || request.cwd.length > 8192 || !isAbsolute(request.cwd)
    || (request.limit !== undefined && (!Number.isSafeInteger(request.limit) || Number(request.limit) < 1 || Number(request.limit) > 25))) {
    return failure("invalid_request");
  }
  try {
    const path = join(request.cwd, ".gsd", "gsd.db");
    if (!existsSync(path)) return failure("database_missing");
    return inspectSqliteReadOnlySnapshot(path, (db) => inspectCutoverCoordination(db, {
      now: new Date().toISOString(), localHost: hostname(), selfPid: process.pid,
      aliasScope: randomUUID(), heartbeatStaleMs: 60000, observePid: observeLocalPid,
      ...observations,
      pidObservationTime: observations?.pidObservationTime ?? (observations ? () => observations.now : () => new Date().toISOString()),
      limit: (request.limit as number | undefined) ?? observations?.limit,
    }));
  } catch {
    // Includes incompatible schemas, locked/unreadable files and unavailable providers. No raw errors.
    return failure("database_unavailable_or_incompatible");
  }
}

export function registerCutoverCoordinationRead(pi: ExtensionAPI): void {
  if (typeof pi.registerRuntimeRead === "function") {
    pi.registerRuntimeRead("authority_cutover_coordination", async (input) => readCutoverCoordination(input));
  }
  pi.registerTool({
    name: "gsd_cutover_coordination_inspect",
    label: "Inspect cutover coordination",
    description: "Read-only bounded coordination guard diagnostic. Does not initialize, migrate, admit, recover or cut over a database. PID observations do not establish identity.",
    parameters: Type.Object({ limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 25 })) }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const result = readCutoverCoordination({ cwd: ctx.cwd, limit: params.limit });
      return { content: [{ type: "text", text: JSON.stringify(result) }], details: result, isError: "error" in result };
    },
  });
}
