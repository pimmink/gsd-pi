import assert from "node:assert/strict";
import type { SpawnSyncReturns } from "node:child_process";

/**
 * Assert a child exited with the expected status and no spawn error or signal.
 * A bare `assert.equal(status, N)` already fails on null status, so this does not
 * catch new failure kinds. It gives each failure mode its own message (spawn
 * error, signal kill, unexpected exit) and includes stderr, and it also rejects a
 * result that has a matching numeric status but a populated error or signal.
 */
export function assertChildExited(
  result: Pick<SpawnSyncReturns<string | Buffer>, "error" | "signal" | "status" | "stderr">,
  expectedStatus: number,
  context = "child",
): void {
  const stderr = typeof result.stderr === "string" ? result.stderr : String(result.stderr ?? "");
  assert.equal(result.error, undefined, `${context}: spawn error ${result.error?.message ?? ""}`);
  assert.equal(result.signal, null, `${context}: killed by signal ${result.signal ?? ""} ${stderr}`);
  assert.equal(result.status, expectedStatus, `${context}: exit ${result.status} ${stderr}`);
}
