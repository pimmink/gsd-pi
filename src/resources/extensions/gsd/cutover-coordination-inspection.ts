// Project/App: gsd-pi
// File Purpose: Bounded, read-only explanation of the unchanged authority cutover coordination guard.

import { createHmac } from "node:crypto";
import type { DbAdapter } from "./db-adapter.js";

export type PidObservation = "self" | "present" | "absent-at-probe" | "permission-denied" | "unknown";
export interface CoordinationObservations {
  now: string;
  localHost: string;
  selfPid: number;
  aliasScope: string;
  heartbeatStaleMs: number;
  observePid: (pid: number) => PidObservation;
  pidObservationTime?: () => string;
  limit?: number;
}

type Row = Record<string, unknown>;
type AliasKind = "worker" | "lease" | "dispatch" | "attempt" | "milestone" | "lifecycle";
export type CoordinationAlias<Kind extends AliasKind> = `${Kind}-${string}`;
const predicates = {
  activeWorkers: "status = 'active' AND project_root_realpath = (SELECT project_root_realpath FROM project_authority WHERE singleton = 1)",
  heldLeases: "status = 'held'",
  activeDispatches: "status IN ('claimed', 'running')",
  activeAttempts: "attempt_state IN ('claimed', 'running')",
} as const;
const tables = {
  activeWorkers: ["workers", "worker_id"],
  heldLeases: ["milestone_leases", "milestone_id"],
  activeDispatches: ["unit_dispatches", "id"],
  activeAttempts: ["workflow_execution_attempts", "attempt_id"],
} as const;

function timestamp(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value)) ? value : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/** Caller owns the query-only snapshot and supplies observations; this never opens a database. */
export function inspectCutoverCoordination(db: DbAdapter, observations: CoordinationObservations) {
  if (db.prepare("PRAGMA query_only").get()?.query_only !== 1) throw new Error("query_only_required");
  const now = timestamp(observations.now);
  if (!now || !observations.aliasScope || !Number.isFinite(observations.heartbeatStaleMs)
    || observations.heartbeatStaleMs < 0) throw new Error("invalid_observations");
  const limit = Math.min(25, Math.max(1, Number.isSafeInteger(observations.limit) ? observations.limit! : 10));
  const alias = <Kind extends AliasKind>(kind: Kind, value: unknown): CoordinationAlias<Kind> | null => value === null || value === undefined ? null
    : `${kind}-${createHmac("sha256", observations.aliasScope).update(JSON.stringify([kind, typeof value, value])).digest("hex").slice(0, 24)}`;
  const age = (value: unknown) => {
    const stored = timestamp(value);
    return stored ? Date.parse(now) - Date.parse(stored) : null;
  };
  const probeTime = () => {
    try { return timestamp(observations.pidObservationTime?.() ?? now); } catch { return null; }
  };
  const probes = new Map<number, { state: PidObservation; observedAt: string | null }>();
  const workerCache = new Map<unknown, ReturnType<typeof readWorker>>();
  function readWorker(id: unknown) {
    const row = db.prepare(`SELECT worker_id, host, pid, started_at, last_heartbeat_at, status,
      project_root_realpath = (SELECT project_root_realpath FROM project_authority WHERE singleton = 1) AS bound_root
      FROM workers WHERE worker_id = ?`).get(id);
    const pid = integer(row?.pid);
    const validPid = pid !== null && pid > 0 && pid <= 2147483647;
    const hostValid = typeof row?.host === "string" && row.host.length > 0;
    const relation = !hostValid ? "unknown" : row!.host === observations.localHost ? "local" : "foreign";
    let liveness: PidObservation = "unknown";
    let pidObservedAt: string | null = null;
    if (validPid && relation === "local") {
      if (pid === observations.selfPid) {
        liveness = "self";
        pidObservedAt = probeTime();
      } else {
        if (!probes.has(pid)) {
          let probe: PidObservation = "unknown";
          try { probe = observations.observePid(pid); } catch { /* No raw errors cross the inspection boundary. */ }
          probes.set(pid, {
            state: ["present", "absent-at-probe", "permission-denied", "unknown"].includes(probe) ? probe : "unknown",
            observedAt: probeTime(),
          });
        }
        liveness = probes.get(pid)!.state;
        pidObservedAt = probes.get(pid)!.observedAt;
      }
    }
    const heartbeatAge = age(row?.last_heartbeat_at);
    return {
      worker: alias("worker", id), found: !!row, relation, pid: validPid ? pid : null,
      pidMalformed: !!row && !validPid, liveness, pidObservedAt,
      status: row?.status === "active" || row?.status === "stopping" || row?.status === "crashed" ? row.status : "unknown",
      boundRoot: row ? row.bound_root === 1 : null,
      startedAt: timestamp(row?.started_at), lastHeartbeatAt: timestamp(row?.last_heartbeat_at),
      heartbeat: heartbeatAge === null ? "unknown" : heartbeatAge < 0 ? "future" : heartbeatAge > observations.heartbeatStaleMs ? "stale" : "recent",
    };
  }
  const worker = (id: unknown) => {
    if (!workerCache.has(id)) workerCache.set(id, readWorker(id));
    return workerCache.get(id)!;
  };
  // Match the current lease by all stored association fields, but never expose its fencing token.
  const leaseForDispatch = (id: unknown) => {
    const row = db.prepare(`SELECT l.milestone_id FROM milestone_leases l JOIN unit_dispatches d
      ON l.milestone_id = d.milestone_id AND l.worker_id = d.worker_id
      AND l.fencing_token = d.milestone_lease_token WHERE d.id = ?`).get(id);
    return alias("lease", row?.milestone_id);
  };
  const authority = db.prepare("SELECT revision, authority_epoch FROM project_authority WHERE singleton = 1").get();
  const revision = integer(authority?.revision);
  const authorityEpoch = integer(authority?.authority_epoch);
  if (revision === null || authorityEpoch === null) throw new Error("incompatible_authority");
  const counts = {} as Record<keyof typeof tables, number>;
  const samples: Record<string, { total: number; returned: number; truncated: boolean; omitted: number; rows: unknown[] }> = {};
  for (const category of Object.keys(tables) as (keyof typeof tables)[]) {
    const [table, key] = tables[category];
    const total = integer(db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${predicates[category]}`).get()?.count);
    if (total === null) throw new Error("incompatible_counts");
    counts[category] = total;
    // Select only fields needed below; no argv, error summaries, content or secrets are read.
    const columns = category === "activeWorkers" ? "worker_id"
      : category === "heldLeases" ? "milestone_id, worker_id, status, acquired_at, expires_at"
      : category === "activeDispatches" ? "id, worker_id, milestone_id, status, started_at, ended_at"
      : "attempt_id, worker_id, lifecycle_id, coordination_dispatch_id, attempt_state, claimed_at, started_at, ended_at";
    const rows = db.prepare(`SELECT ${columns} FROM ${table} WHERE ${predicates[category]} ORDER BY ${key} LIMIT ?`).all(limit).map((row: Row) => {
      if (category === "activeWorkers") return worker(row.worker_id);
      if (category === "heldLeases") {
        const expiresAge = age(row.expires_at);
        return { lease: alias("lease", row.milestone_id), milestone: alias("milestone", row.milestone_id),
          owner: worker(row.worker_id), status: "held", acquiredAt: timestamp(row.acquired_at), expiresAt: timestamp(row.expires_at),
          expiry: expiresAge === null ? "unknown" : expiresAge >= 0 ? "expired" : "unexpired" };
      }
      if (category === "activeDispatches") return {
        dispatch: alias("dispatch", row.id), lease: leaseForDispatch(row.id), milestone: alias("milestone", row.milestone_id),
        owner: worker(row.worker_id), status: row.status, startedAt: timestamp(row.started_at), endedAt: timestamp(row.ended_at),
      };
      const dispatch = row.coordination_dispatch_id === null ? undefined
        : db.prepare("SELECT id, worker_id FROM unit_dispatches WHERE id = ?").get(row.coordination_dispatch_id);
      return { attempt: alias("attempt", row.attempt_id), lifecycle: alias("lifecycle", row.lifecycle_id),
        owner: worker(row.worker_id), status: row.attempt_state, claimedAt: timestamp(row.claimed_at),
        startedAt: timestamp(row.started_at), endedAt: timestamp(row.ended_at),
        dispatch: alias("dispatch", row.coordination_dispatch_id), dispatchFound: !!dispatch,
        dispatchWorker: alias("worker", dispatch?.worker_id), dispatchLease: dispatch ? leaseForDispatch(dispatch.id) : null,
        lease: alias("lease", db.prepare(`SELECT l.milestone_id FROM milestone_leases l
          JOIN workflow_item_lifecycles c ON c.milestone_id = l.milestone_id
          JOIN workflow_execution_attempts a ON a.lifecycle_id = c.lifecycle_id
          AND a.worker_id = l.worker_id AND a.milestone_lease_token = l.fencing_token
          WHERE a.attempt_id = ?`).get(row.attempt_id)?.milestone_id) };
    });
    samples[category] = { total, returned: rows.length, truncated: total > rows.length, omitted: total - rows.length, rows };
  }
  return {
    operation: "authority_cutover_coordination" as const,
    revision, authorityEpoch, observedAt: now,
    counts, blockedCategories: (Object.keys(counts) as (keyof typeof tables)[]).filter((key) => counts[key] > 0),
    limitPerCategory: limit, heartbeatStaleMs: observations.heartbeatStaleMs, samples,
    caveat: "Status predicates, not process liveness, govern cutover. Separately timestamped PID observations are outside the DB snapshot and do not establish process identity. Aliases are response-scoped.",
  };
}
