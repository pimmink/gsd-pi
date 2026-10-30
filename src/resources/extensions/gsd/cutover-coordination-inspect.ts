// Safety gate, not a read model: inspection is deliberately disabled.
// A source SQLite read can write SHM or create sidecars, and lstat followed by
// open cannot protect against directory replacement. LIMIT also does not bound
// query execution time or selected value sizes. Until an isolated, bounded
// snapshot design is proven, do not access even an apparently offline source.

const MAX_LIMIT = 25;
const NOTICE = "Inspection is disabled: safe source access and execution bounds are not established. No database or process observations were made. PID observations do not establish identity or authorize recovery.";

/** Fixed-size refusal only. No I/O, SQL, input coercion, PID probes or deferred work. */
export function readCutoverCoordination(_projectDir: string, limit = 10, signal?: AbortSignal) {
  const base = { status: "refused" as const, notice: NOTICE, processIdentity: "unverified" as const };
  // Do not throw/serialize signal.reason: it may contain private diagnostics.
  if (signal?.aborted) return { ...base, reason: "aborted" as const };
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { ...base, reason: "invalid-limit" as const };
  }
  return { ...base, reason: "inspection-disabled" as const };
}
