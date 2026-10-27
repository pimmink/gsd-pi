// gsd-pi — deterministic temporary-fixture cutover diagnostic tests. No engine opens.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { runInNewContext } from "node:vm";

import { createDbAdapter } from "../db-adapter.ts";
import { createCoordinationTablesV24 } from "../db-coordination-schema.ts";
import { inspectSqliteReadOnlySnapshot } from "../sqlite-readonly.ts";
import { inspectCutoverCoordination, type CoordinationObservations } from "../cutover-coordination-inspection.ts";
import { observeLocalPid, readCutoverCoordination, registerCutoverCoordinationRead } from "../cutover-coordination-runtime-read.ts";

const now = "2026-10-25T12:00:00.000Z";
const old = "2026-10-24T12:00:00.000Z";
const host = "private-host-do-not-output";
const root = "/private/customer-path-do-not-output";
const observations: CoordinationObservations = {
  now, localHost: host, selfPid: 101, aliasScope: "deterministic-response-one", heartbeatStaleMs: 60000,
  observePid: () => "absent-at-probe",
};

function fixture(t: test.TestContext) {
  const cwd = mkdtempSync(join(tmpdir(), "gsd-cutover-diagnostic-"));
  mkdirSync(join(cwd, ".gsd"));
  const path = join(cwd, ".gsd", "gsd.db");
  const raw = new DatabaseSync(path);
  const db = createDbAdapter(raw);
  // Deliberately allow orphan references to exercise historical/malformed coordination rows.
  db.exec("PRAGMA foreign_keys=OFF");
  t.after(() => { db.close(); rmSync(cwd, { recursive: true, force: true }); });
  db.exec(`CREATE TABLE project_authority (singleton INTEGER PRIMARY KEY, project_id TEXT,
    project_root_realpath TEXT, revision INTEGER, authority_epoch INTEGER);
    CREATE TABLE milestones (id TEXT PRIMARY KEY);`);
  db.prepare("INSERT INTO project_authority VALUES (1, 'project', ?, 7, 0)").run(root);
  createCoordinationTablesV24(db);
  // Read-shape fixtures only: no lifecycle writer triggers (which consult wall-clock admission/fences).
  // Column names/types mirror db-lifecycle-foundation-schema.ts; production checks remain untouched.
  db.exec(`CREATE TABLE workflow_item_lifecycles (lifecycle_id TEXT PRIMARY KEY, milestone_id TEXT);
    CREATE TABLE workflow_execution_attempts (attempt_id TEXT PRIMARY KEY, project_id TEXT, lifecycle_id TEXT,
      attempt_number INTEGER, attempt_state TEXT, coordination_dispatch_id INTEGER, worker_id TEXT,
      milestone_lease_token INTEGER, claimed_at TEXT, started_at TEXT, ended_at TEXT,
      claim_operation_id TEXT, claim_project_revision INTEGER, claim_authority_epoch INTEGER);`);
  function worker(id = "private-worker", pid: unknown = 102, workerHost: unknown = host, workerRoot = root, status = "active") {
    db.prepare("INSERT INTO workers VALUES (?, ?, ?, ?, 'version', ?, ?, ?)").run(id, workerHost, pid, old, old, status, workerRoot);
  }
  function lease(id = "private-milestone", owner = "private-worker", expiry = old) {
    db.prepare("INSERT INTO milestone_leases VALUES (?, ?, 99, ?, ?, 'held')").run(id, owner, old, expiry);
  }
  function dispatch(id = 1, owner = "private-worker", status = "running") {
    db.prepare(`INSERT INTO unit_dispatches
      (id, trace_id, worker_id, milestone_lease_token, milestone_id, unit_type, unit_id, status, started_at)
      VALUES (?, 'private-trace', ?, 99, 'private-milestone', 'task', ?, ?, ?)`).run(id, owner, `private-unit-${id}`, status, old);
  }
  function attempt(id = "private-attempt", dispatchId: number | null = 1, owner: string | null = "private-worker", state = "running") {
    db.prepare(`INSERT INTO workflow_execution_attempts
      (attempt_id, project_id, lifecycle_id, attempt_number, attempt_state, coordination_dispatch_id,
       worker_id, milestone_lease_token, claimed_at, started_at, claim_operation_id, claim_project_revision, claim_authority_epoch)
      VALUES (?, 'project', ?, 1, ?, ?, ?, ?, ?, ?, 'claim', 7, 0)`)
      .run(id, `lifecycle-${id}`, state, dispatchId, owner, owner ? 99 : null, old, state === "running" ? old : null);
  }
  const inspect = (extra: Partial<CoordinationObservations> = {}) => inspectSqliteReadOnlySnapshot(path,
    (snapshot) => inspectCutoverCoordination(snapshot, { ...observations, ...extra }));
  return { cwd, path, db, worker, lease, dispatch, attempt, inspect };
}

// Execute the actual unchanged guard body against the fixture adapter, without importing its engine/admission graph.
const guardSource = readFileSync(new URL("../project-authority-cutover-domain-operation.ts", import.meta.url), "utf8");
const guardBody = guardSource.slice(guardSource.indexOf("export function requireCoordinationIdle(): void {"),
  guardSource.indexOf("\n}\n", guardSource.indexOf("export function requireCoordinationIdle(): void {")) + 2)
  .replace("export function requireCoordinationIdle(): void", "function requireCoordinationIdle()");
function guardCounts(db: ReturnType<typeof createDbAdapter>) {
  let captured: unknown;
  runInNewContext(`${guardBody}\nrequireCoordinationIdle();`, {
    getDb: () => db,
    fail: (_code: string, _message: string, _retry: boolean, counts: unknown) => { captured = counts; },
  });
  return captured ? JSON.parse(JSON.stringify(captured)) : { activeWorkers: 0, heldLeases: 0, activeDispatches: 0, activeAttempts: 0 };
}

for (const category of ["zero", "activeWorkers", "heldLeases", "activeDispatches", "activeAttempts", "mixed"]) {
  test(`guard-exact count parity: ${category}`, (t) => {
    const f = fixture(t);
    if (category === "activeWorkers" || category === "mixed") f.worker();
    if (category === "heldLeases" || category === "mixed") f.lease();
    if (category === "activeDispatches" || category === "mixed") f.dispatch();
    if (category === "activeAttempts" || category === "mixed") f.attempt();
    const result = f.inspect();
    assert.deepEqual(result.counts, guardCounts(f.db));
    assert.deepEqual(result.blockedCategories, Object.keys(result.counts).filter((key) => result.counts[key as keyof typeof result.counts] > 0));
    assert.equal(result.authorityEpoch, 0);
    assert.equal(result.revision, 7);
  });
}

test("stale workers and expired held leases block; non-bound/inactive workers and inactive rows do not", (t) => {
  const f = fixture(t);
  f.worker(); f.lease();
  f.worker("other-root", 104, host, "/another/private/root");
  f.worker("stopped", 105, host, root, "crashed");
  f.dispatch(1, "private-worker", "completed");
  f.attempt("claimed", null, null, "claimed");
  const result = f.inspect();
  assert.deepEqual(result.counts, guardCounts(f.db));
  assert.equal(result.counts.activeWorkers, 1);
  assert.equal(result.counts.activeDispatches, 0);
  const worker = result.samples.activeWorkers.rows[0] as any;
  assert.equal(worker.heartbeat, "stale");
  assert.equal(worker.liveness, "absent-at-probe");
  assert.equal((result.samples.heldLeases.rows[0] as any).expiry, "expired");
  assert.equal((result.samples.activeAttempts.rows[0] as any).owner.found, false);
});

test("local, self, foreign, malformed and missing workers remain visible; only local valid PIDs probed", (t) => {
  const f = fixture(t);
  f.worker("a-self", 101);
  f.worker("b-present", 102);
  f.worker("c-permission", 103);
  f.worker("d-foreign", 104, "foreign-private-host");
  f.worker("e-malformed-pid", "secret-not-a-pid");
  f.worker("f-malformed-host", 105, "");
  f.lease("missing-worker-lease", "unparseable-owner");
  const probed: number[] = [];
  const probeAt = "2026-10-25T12:00:01.000Z";
  const result = f.inspect({ pidObservationTime: () => probeAt,
    observePid: (pid) => { probed.push(pid); return pid === 102 ? "present" : "permission-denied"; } });
  assert.deepEqual(probed, [102, 103]);
  const rows = result.samples.activeWorkers.rows as any[];
  assert.deepEqual(rows.map((row) => row.liveness), ["self", "present", "permission-denied", "unknown", "unknown", "unknown"]);
  assert.deepEqual(rows.map((row) => row.relation), ["local", "local", "local", "foreign", "local", "unknown"]);
  assert.equal(rows[4].pid, null);
  assert.equal(rows[4].pidMalformed, true);
  assert.equal(rows[1].pidObservedAt, probeAt);
  assert.equal(rows[3].pidObservedAt, null);
  assert.equal(result.observedAt, now);
  assert.equal((result.samples.heldLeases.rows[0] as any).owner.found, false);
  const output = JSON.stringify(result);
  for (const privateValue of [host, root, "foreign-private-host", "unparseable-owner", "secret-not-a-pid"]) assert.ok(!output.includes(privateValue));
});

test("signal-zero probes classify only bounded observations and redact errors", () => {
  assert.equal(observeLocalPid(12, (_pid, signal) => { assert.equal(signal, 0); }), "present");
  for (const [code, expected] of [["ESRCH", "absent-at-probe"], ["EPERM", "permission-denied"], ["EIO", "unknown"]]) {
    assert.equal(observeLocalPid(12, () => { throw Object.assign(new Error("private error"), { code }); }), expected);
  }
  for (const pid of [0, -1, NaN, 1.5, 2147483648]) assert.equal(observeLocalPid(pid, () => assert.fail("must not probe")), "unknown");
});

test("association aliases are typed, stable within a response and scoped across responses", (t) => {
  const f = fixture(t);
  f.worker(); f.lease(); f.dispatch(); f.attempt();
  // Lifecycle row supplies the Attempt's own lease association, independently of dispatch.
  f.db.exec("INSERT INTO workflow_item_lifecycles VALUES ('lifecycle-private-attempt', 'private-milestone')");
  const result = f.inspect();
  const w = result.samples.activeWorkers.rows[0] as any;
  const l = result.samples.heldLeases.rows[0] as any;
  const d = result.samples.activeDispatches.rows[0] as any;
  const a = result.samples.activeAttempts.rows[0] as any;
  assert.equal(l.owner.worker, w.worker);
  assert.equal(d.owner.worker, w.worker);
  assert.equal(a.owner.worker, w.worker);
  assert.equal(a.dispatchWorker, w.worker);
  assert.equal(a.dispatch, d.dispatch);
  assert.equal(a.lease, l.lease);
  assert.equal(d.lease, l.lease);
  assert.notEqual(l.lease, l.milestone);
  assert.match(w.worker, /^worker-[a-f0-9]{24}$/);
  assert.deepEqual(f.inspect(), result);
  assert.notEqual((f.inspect({ aliasScope: "response-two" }).samples.activeWorkers.rows[0] as any).worker, w.worker);
  const json = JSON.stringify(result);
  for (const value of ["private-worker", "private-milestone", "private-attempt", "private-trace", "private-unit", "fencing", "lease_token"]) assert.ok(!json.includes(value));
});

test("deterministic bounded samples include totals, omissions and explicit truncation", (t) => {
  const f = fixture(t);
  for (const id of ["c", "a", "b"]) { f.worker(id); f.lease(id, id); }
  for (const id of [9, 2, 5]) f.dispatch(id, "a");
  for (const id of ["z", "y", "x"]) f.attempt(id, null);
  const full = f.inspect();
  const small = f.inspect({ limit: 2 });
  for (const category of Object.keys(small.samples)) {
    assert.equal(small.samples[category].total, 3);
    assert.equal(small.samples[category].returned, 2);
    assert.equal(small.samples[category].omitted, 1);
    assert.equal(small.samples[category].truncated, true);
    assert.deepEqual(small.samples[category].rows, full.samples[category].rows.slice(0, 2));
  }
  assert.deepEqual(small, f.inspect({ limit: 2 }));
  assert.equal(f.inspect({ limit: 999 }).limitPerCategory, 25);
});

test("query-only snapshot, epoch zero and complete database bytes remain unchanged", (t) => {
  const f = fixture(t);
  f.worker(); f.lease(); f.dispatch(); f.attempt();
  const hash = () => createHash("sha256").update(readFileSync(f.path)).digest("hex");
  const before = hash();
  const entries = readdirSync(join(f.cwd, ".gsd"));
  inspectSqliteReadOnlySnapshot(f.path, (db) => {
    assert.equal(db.prepare("PRAGMA query_only").get()?.query_only, 1);
    assert.throws(() => db.exec("UPDATE project_authority SET revision = 999"));
    return inspectCutoverCoordination(db, observations);
  });
  assert.throws(() => inspectCutoverCoordination(f.db, observations), /query_only_required/);
  const runtime = readCutoverCoordination({ cwd: f.cwd }, observations);
  assert.ok(!("error" in runtime), JSON.stringify(runtime));
  assert.equal(hash(), before);
  assert.deepEqual(readdirSync(join(f.cwd, ".gsd")), entries);
  assert.deepEqual(f.db.prepare("SELECT revision, authority_epoch FROM project_authority").get(), { revision: 7, authority_epoch: 0 });
});

function errorCode(result: ReturnType<typeof readCutoverCoordination>): string {
  assert.ok("error" in result);
  return result.error;
}

test("missing, incompatible and malformed database errors are bounded/redacted and do not bootstrap", (t) => {
  const f = fixture(t);
  const missing = join(f.cwd, "missing");
  assert.equal(errorCode(readCutoverCoordination({ cwd: missing })), "database_missing");
  assert.ok(!readdirSync(f.cwd).includes("missing"));
  f.db.exec("DROP TABLE workers");
  const result = readCutoverCoordination({ cwd: f.cwd }, observations);
  assert.equal(errorCode(result), "database_unavailable_or_incompatible");
  const other = join(f.cwd, "malformed");
  mkdirSync(join(other, ".gsd"), { recursive: true });
  const path = join(other, ".gsd", "gsd.db");
  writeFileSync(path, "private-host /secret/path token=private-secret");
  const before = readFileSync(path);
  assert.equal(errorCode(readCutoverCoordination({ cwd: other })), "database_unavailable_or_incompatible");
  assert.deepEqual(readFileSync(path), before);
  for (const request of [{}, { cwd: "relative" }, { cwd: f.cwd, limit: 0 }, { cwd: f.cwd, limit: 26 }]) {
    assert.equal(errorCode(readCutoverCoordination(request)), "invalid_request");
  }
  assert.ok(!JSON.stringify(result).includes(f.cwd));
  assert.ok(!JSON.stringify(result).includes("workers"));
});

test("registration exposes the diagnostic runtime read and tool without opening an engine", async (t) => {
  const f = fixture(t);
  const reads = new Map<string, (input: unknown) => unknown>();
  const tools: any[] = [];
  registerCutoverCoordinationRead({ registerRuntimeRead: (name: string, fn: (input: unknown) => unknown) => reads.set(name, fn),
    registerTool: (tool: unknown) => tools.push(tool) } as any);
  assert.deepEqual([...reads.keys()], ["authority_cutover_coordination"]);
  assert.equal(tools[0].name, "gsd_cutover_coordination_inspect");
  const runtime = await reads.get("authority_cutover_coordination")!({ cwd: f.cwd });
  const tool = await tools[0].execute("id", { limit: 1 }, undefined, undefined, { cwd: f.cwd });
  assert.deepEqual(tool.details.counts, (runtime as any).counts);
  assert.equal(tool.isError, false);
  const failure = await tools[0].execute("id", {}, undefined, undefined, { cwd: join(f.cwd, "missing") });
  assert.equal(failure.isError, true);
  registerCutoverCoordinationRead({ registerTool: () => {} } as any);
});

test("hard sample cap and probe failures remain bounded with malformed stored annotations", (t) => {
  const f = fixture(t);
  for (let i = 29; i >= 0; i--) f.worker(`owner-${String(i).padStart(2, "0")}`, 200 + i);
  f.db.exec("UPDATE workers SET last_heartbeat_at = 'private-secret-invalid-time', started_at = '/private/path'");
  let calls = 0;
  const result = f.inspect({ limit: 1000, observePid: () => { calls++; throw new Error("private-host /private/path secret"); } });
  assert.equal(result.counts.activeWorkers, 30);
  assert.equal(result.samples.activeWorkers.returned, 25);
  assert.equal(result.samples.activeWorkers.omitted, 5);
  assert.equal(result.samples.activeWorkers.truncated, true);
  assert.equal(calls, 25);
  for (const row of result.samples.activeWorkers.rows as any[]) {
    assert.equal(row.liveness, "unknown");
    assert.equal(row.heartbeat, "unknown");
    assert.equal(row.startedAt, null);
    assert.equal(row.lastHeartbeatAt, null);
  }
  assert.doesNotMatch(JSON.stringify(result), /private-secret|private-host|private\/path/);
});

test("lease associations require stored token matches and never fabricate an owner", (t) => {
  const f = fixture(t);
  f.worker(); f.lease(); f.dispatch(); f.attempt();
  f.db.exec("INSERT INTO workflow_item_lifecycles VALUES ('lifecycle-private-attempt', 'private-milestone')");
  f.db.exec("UPDATE milestone_leases SET fencing_token = 100");
  const result = f.inspect();
  const dispatch = result.samples.activeDispatches.rows[0] as any;
  const attempt = result.samples.activeAttempts.rows[0] as any;
  assert.equal(dispatch.lease, null);
  assert.equal(attempt.lease, null);
  assert.equal(attempt.dispatchLease, null);
  assert.equal(attempt.dispatch, dispatch.dispatch);
  assert.deepEqual(result.counts, guardCounts(f.db));
});

test("reader dependency graph excludes normal engine/admission/backfill/cutover imports", () => {
  for (const file of ["cutover-coordination-inspection.ts", "cutover-coordination-runtime-read.ts", "sqlite-readonly.ts", "db-adapter.ts", "errors.ts"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:from|import\()\s*["'][^"']*(?:db\/engine|db\.js|admission|backfill|authority-cutover-on-open|project-authority-cutover-domain-operation)/);
    assert.doesNotMatch(source, /\bopenDatabase\s*\(/);
  }
});
