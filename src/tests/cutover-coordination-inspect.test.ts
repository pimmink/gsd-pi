import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs, { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import sqlite, { DatabaseSync } from "node:sqlite";
import test, { type TestContext } from "node:test";
import { readCutoverCoordination } from "../resources/extensions/gsd/cutover-coordination-inspect.js";

function temporaryRoot(t: TestContext) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "coordination-inspect-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function fixture(t: TestContext) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "coordination-inspect-")));
  const directory = join(root, ".gsd");
  mkdirSync(directory);
  const path = join(directory, "gsd.db");
  const db = new DatabaseSync(path);
  // Close the writer before removing the fixture, never during a comparison.
  t.after(() => { db.close(); rmSync(root, { recursive: true, force: true }); });
  db.exec(`PRAGMA application_id = 0x47534442;
    CREATE TABLE project_authority (singleton INTEGER, project_root_realpath TEXT);
    CREATE TABLE workers (worker_id TEXT PRIMARY KEY, host TEXT, pid INTEGER, status TEXT, project_root_realpath TEXT);
    CREATE TABLE milestone_leases (milestone_id TEXT PRIMARY KEY, worker_id TEXT, status TEXT, expires_at TEXT);
    CREATE TABLE unit_dispatches (status TEXT);
    CREATE TABLE workflow_execution_attempts (attempt_state TEXT);`);
  db.prepare("INSERT INTO project_authority VALUES (1, ?)").run(root);
  const worker = (id: string) => db.prepare("INSERT INTO workers VALUES (?, ?, ?, 'active', ?)")
    .run(id, hostname(), process.pid, root);
  return { root, directory, path, db, worker };
}

// Include every entry and link target, and hash every regular file -- especially
// SHM, whose read-mark bytes an ordinary SQLite read can change.
function snapshot(directory: string): unknown {
  return readdirSync(directory).sort().map(name => {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return [name, "symlink", readlinkSync(path)];
    if (stat.isDirectory()) return [name, "directory", snapshot(path)];
    assert.ok(stat.isFile());
    return [name, stat.size, createHash("sha256").update(readFileSync(path)).digest("hex")];
  });
}

function assertDisabled(result: ReturnType<typeof readCutoverCoordination>) {
  assert.equal(result.status, "refused");
  assert.equal(result.reason, "inspection-disabled");
  assert.equal(result.processIdentity, "unverified");
  assert.match(result.notice, /disabled/i);
  assert.deepEqual(Object.keys(result).sort(), ["notice", "processIdentity", "reason", "status"]);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 512);
}

function assertUntouched(root: string) {
  const before = snapshot(root);
  const result = readCutoverCoordination(root);
  assert.deepEqual(snapshot(root), before);
  assertDisabled(result);
}

test("live WAL refusal preserves DB, WAL, SHM (including byte 104) and every directory entry", t => {
  const f = fixture(t);
  f.db.exec("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0");
  f.worker("private-uncheckpointed-worker");
  for (const suffix of ["", "-wal", "-shm"]) assert.ok(existsSync(`${f.path}${suffix}`));
  const readMark = readFileSync(`${f.path}-shm`)[104];
  assertUntouched(f.root);
  assert.equal(readFileSync(`${f.path}-shm`)[104], readMark);
});

test("offline databases also fail closed without sidecars or an unsafe source read", t => {
  const f = fixture(t);
  assertUntouched(f.root);
  f.db.exec("PRAGMA journal_mode = WAL; PRAGMA wal_checkpoint(TRUNCATE)");
  const offline = join(f.root, "offline");
  mkdirSync(join(offline, ".gsd"), { recursive: true });
  copyFileSync(f.path, join(offline, ".gsd", "gsd.db"));
  assertUntouched(offline);
});

test("missing, corrupt, unrelated and incomplete sources are never created or repaired", t => {
  const root = temporaryRoot(t);
  assertUntouched(root);
  assert.equal(existsSync(join(root, ".gsd")), false);
  mkdirSync(join(root, ".gsd"));
  assertUntouched(root);
  const path = join(root, ".gsd", "gsd.db");
  writeFileSync(path, "private-corrupt-data");
  assertUntouched(root);
  rmSync(path);
  const db = new DatabaseSync(path);
  try {
    db.exec("CREATE TABLE private_data (secret TEXT)");
    assertUntouched(root);
    db.exec("PRAGMA application_id = 0x47534442");
    assertUntouched(root);
  } finally { db.close(); }
});

test("directory, database and all sidecar symlinks leave source and link targets untouched", async t => {
  for (const name of [".gsd", "gsd.db", "gsd.db-wal", "gsd.db-shm", "gsd.db-journal"]) {
    await t.test(name, t => {
      const f = fixture(t);
      f.db.exec("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0");
      f.worker("private-symlink-wal-worker");
      const target = temporaryRoot(t);
      if (name === ".gsd") {
        renameSync(f.directory, join(target, "private-directory"));
        symlinkSync(join(target, "private-directory"), f.directory);
      } else {
        if (existsSync(join(f.directory, name))) {
          renameSync(join(f.directory, name), join(target, "private-target"));
        } else {
          writeFileSync(join(target, "private-target"), "private-data");
        }
        symlinkSync(join(target, "private-target"), join(f.directory, name));
      }
      const before = snapshot(target);
      assertUntouched(f.root);
      assert.deepEqual(snapshot(target), before);
    });
  }
});

test("directory replacement at the old lstat/open boundary cannot create WAL/SHM in the replacement", t => {
  const f = fixture(t);
  f.db.exec("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0; PRAGMA wal_checkpoint(TRUNCATE)");
  const replacement = join(f.root, "replacement");
  const parked = join(f.root, "parked");
  mkdirSync(replacement);
  copyFileSync(f.path, join(replacement, "gsd.db"));
  f.worker("private-live-wal-worker");
  const sourceBefore = snapshot(f.directory);
  const replacementBefore = snapshot(replacement);
  let swapped = false;
  const swap = () => {
    renameSync(f.directory, parked);
    renameSync(replacement, f.directory);
    swapped = true;
  };
  const original = fs.lstatSync;
  const probe = t.mock.method(fs, "lstatSync", ((path: fs.PathLike, ...args: unknown[]) => {
    try { return Reflect.apply(original, fs, [path, ...args]); }
    finally { if (path === `${f.path}-journal`) swap(); }
  }) as typeof fs.lstatSync);
  syncBuiltinESMExports();
  let result: ReturnType<typeof readCutoverCoordination>;
  try { result = readCutoverCoordination(f.root); }
  finally { probe.mock.restore(); syncBuiltinESMExports(); }
  assert.deepEqual(snapshot(swapped ? parked : f.directory), sourceBefore);
  assert.deepEqual(snapshot(swapped ? f.directory : replacement), replacementBefore);
  assertDisabled(result!);
  assert.equal(probe.mock.callCount(), 0, "disabled inspector must not leave a pathname race window");
  // Exercise an already replaced path too, not just the unreachable hook.
  if (!swapped) swap();
  assertUntouched(f.root);
  assert.deepEqual(snapshot(parked), sourceBefore);
  assert.deepEqual(snapshot(f.directory), replacementBefore);
});

test("orphaned WAL, SHM and rollback journals remain byte-identical without recovery", t => {
  const f = fixture(t);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    writeFileSync(`${f.path}${suffix}`, `private-${suffix}`);
    assertUntouched(f.root);
  }
});

test("refusal has no filesystem, SQLite, path-coercion or PID-probe dependency", t => {
  const fail = () => { throw new Error("private-source-access-must-not-run"); };
  const probes = [
    t.mock.method(fs, "realpathSync", fail), t.mock.method(fs, "lstatSync", fail),
    t.mock.method(fs, "openSync", fail), t.mock.method(fs, "readFileSync", fail),
    t.mock.method(sqlite, "DatabaseSync", fail), t.mock.method(process, "kill", fail),
  ];
  syncBuiltinESMExports();
  try {
    assertDisabled(readCutoverCoordination({ [Symbol.toPrimitive]: fail } as unknown as string));
    for (const probe of probes) assert.equal(probe.mock.callCount(), 0);
  } finally { for (const probe of probes) probe.mock.restore(); syncBuiltinESMExports(); }
});

test("invalid limits and abort reasons are never coerced, echoed or probed", () => {
  for (const limit of [0, -1, 26, 1.5, NaN, Infinity, "25", null, "private-value".repeat(1_000_000)]) {
    const result = readCutoverCoordination("/private/project", limit as number);
    assert.equal(result.status, "refused");
    assert.equal(result.reason, "invalid-limit");
    assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 512);
    assert.doesNotMatch(JSON.stringify(result), /private/);
  }
  const controller = new AbortController();
  controller.abort(new Error("/private/abort-reason token=private-token"));
  const result = readCutoverCoordination("/private/project", 10, controller.signal);
  assert.equal(result.reason, "aborted");
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 512);
  assert.doesNotMatch(JSON.stringify(result), /private|token/);
});

// A process watchdog, unlike a timer around synchronous SQLite, can stop a
// regressed recursive query. No dependencies or source files are changed.
function assertBoundedChild(root: string) {
  const source = new URL("../resources/extensions/gsd/cutover-coordination-inspect.ts", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "--eval", `
    import { performance } from 'node:perf_hooks';
    const { readCutoverCoordination } = await import(${JSON.stringify(source)});
    const start = performance.now();
    for (let n = 0; n < 100; n++) {
      const result = readCutoverCoordination(${JSON.stringify(root)}, 25);
      if (result.reason !== 'inspection-disabled' || Buffer.byteLength(JSON.stringify(result)) > 512) process.exit(2);
    }
    if (performance.now() - start > 250) process.exit(3);
    console.log('bounded-refusal');
  `], { encoding: "utf8", timeout: 2_000, maxBuffer: 1_024 });
  assert.equal(child.error, undefined, "inspector exceeded the process deadline/output budget");
  assert.equal(child.signal, null);
  assert.equal(child.status, 0, "inspector must refuse within 250ms with <=512 response bytes");
  assert.equal(child.stdout.trim(), "bounded-refusal");
}

test("multi-megabyte selected values cannot be materialized and refusals meet latency/output budgets", t => {
  const f = fixture(t);
  const huge = "private-stored-value-".repeat(100_000);
  f.db.prepare("INSERT INTO workers VALUES (?, ?, ?, ?, ?)").run(huge, huge, process.pid, huge, huge);
  f.db.prepare("INSERT INTO milestone_leases VALUES (?, ?, ?, ?)").run(huge, huge, huge, huge);
  const before = snapshot(f.root);
  assertBoundedChild(f.root);
  assert.deepEqual(snapshot(f.root), before);
});

test("LIMIT cannot trigger an unbounded recursive view because no query is executed", t => {
  const f = fixture(t);
  f.db.exec(`DROP TABLE workers;
    CREATE VIEW workers AS WITH RECURSIVE unbounded(n) AS
      (VALUES(1) UNION ALL SELECT n + 1 FROM unbounded)
      SELECT n AS worker_id, 'private-host' AS host, n AS pid,
        'inactive' AS status, 'private-root' AS project_root_realpath FROM unbounded;`);
  const before = snapshot(f.root);
  assertBoundedChild(f.root);
  assert.deepEqual(snapshot(f.root), before);
});

test("valid limits always return the same bounded refusal without response-scoped observations", () => {
  const start = performance.now();
  for (let limit = 1; limit <= 25; limit++) assertDisabled(readCutoverCoordination("/private/project", limit));
  assert.ok(performance.now() - start < 250);
});
