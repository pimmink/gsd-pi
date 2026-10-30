/**
 * Regression test for #3672 — query-tools uses ensureDbOpen
 *
 * gsd_milestone_status previously called isDbAvailable() but never
 * ensureDbOpen(), making it always fail outside auto-mode sessions.
 * The fix imports ensureDbOpen from dynamic-tools and calls it before
 * querying the DB.
 *
 * This behavior test registers the query tool and executes it against a
 * temp workspace where the DB must be opened on demand.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { closeDatabase, getDbOrNull, insertMilestone, openDatabase } from '../gsd-db.ts';
import { registerQueryTools } from '../bootstrap/query-tools.ts';

describe('query-tools ensureDbOpen usage (#3672)', () => {
  test('gsd_milestone_status opens the workspace DB before querying', async () => {
    const base = mkdtempSync(join(tmpdir(), 'gsd-query-tools-'));
    const dbPath = join(base, '.gsd', 'gsd.db');
    const tools: Record<string, any> = {};
    const originalCwd = process.cwd();
    try {
      mkdirSync(join(base, '.gsd'), { recursive: true });
      openDatabase(dbPath);
      insertMilestone({ id: 'M001', title: 'Query me', status: 'active' });
      closeDatabase();

      registerQueryTools({ registerTool(tool: any) { tools[tool.name] = tool; } } as any);
      const result = await tools.gsd_milestone_status.execute(
        'call-1',
        { milestoneId: 'M001' },
        undefined,
        undefined,
        { cwd: base },
      );

      assert.notEqual(result.details?.error, 'db_unavailable');
      assert.equal(result.details?.milestoneId ?? result.details?.milestone?.id, 'M001');
    } finally {
      process.chdir(originalCwd);
      closeDatabase();
      rmSync(base, { recursive: true, force: true });
    }
  });
});


test('disabled cutover inspector never uses ensureDbOpen, even for a missing or incomplete database', async () => {
  const base = mkdtempSync(join(tmpdir(), 'gsd-inspect-tool-'));
  const tools: Record<string, any> = {};
  closeDatabase();
  try {
    registerQueryTools({ registerTool(tool: any) { tools[tool.name] = tool; } } as any);
    const inspect = () => tools.gsd_cutover_coordination_inspect.execute('inspect-1', {}, undefined, undefined, { cwd: base });
    const missing = await inspect();
    assert.equal(missing.details.status, 'refused');
    assert.equal(missing.details.reason, 'inspection-disabled');
    assert.equal(existsSync(join(base, '.gsd')), false);
    assert.equal(getDbOrNull(), null);
    mkdirSync(join(base, '.gsd'));
    const path = join(base, '.gsd', 'gsd.db');
    const raw = new DatabaseSync(path);
    raw.exec('PRAGMA application_id = 0x47534442; CREATE TABLE private_data (secret TEXT)');
    raw.close();
    const before = readFileSync(path);
    assert.equal((await inspect()).details.reason, 'inspection-disabled');
    assert.deepEqual(readFileSync(path), before);
    assert.equal(getDbOrNull(), null);
    assert.equal(tools.gsd_cutover_coordination_inspect.parameters.properties.limit.minimum, 1);
    assert.equal(tools.gsd_cutover_coordination_inspect.parameters.properties.limit.maximum, 25);
  } finally { closeDatabase(); rmSync(base, { recursive: true, force: true }); }
});


test('disabled inspector honors AbortSignal without reading cwd or leaking its reason', async () => {
  const tools: Record<string, any> = {};
  registerQueryTools({ registerTool(tool: any) { tools[tool.name] = tool; } } as any);
  const tool = tools.gsd_cutover_coordination_inspect;
  const ctx = { get cwd() { throw new Error('private-cwd-must-not-be-resolved'); } };
  const controller = new AbortController();
  controller.abort(new Error('/private/abort token=private-token'));
  const result = await tool.execute('inspect-abort', { limit: 25 }, controller.signal, undefined, ctx);
  assert.equal(result.details.status, 'refused');
  assert.equal(result.details.reason, 'aborted');
  assert.equal(result.content[0].text, JSON.stringify(result.details));
  assert.ok(Buffer.byteLength(result.content[0].text) <= 512);
  assert.doesNotMatch(JSON.stringify(result), /private|token/);
  assert.match(tool.description, /Disabled safety gate/);
  // execute has no await/deferred work: an immediate abort cannot race source work.
  const pending = tool.execute('inspect-no-work', {}, undefined, undefined, ctx);
  assert.equal((await pending).details.reason, 'inspection-disabled');
});


test('engine inspector accessor still refuses access during private maintenance ownership', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'gsd-inspect-owner-')));
  const engine = await import('../db/engine.js');
  let host: ReturnType<typeof engine.openCoordinationMaintenanceHost> | undefined;
  closeDatabase();
  try {
    mkdirSync(join(base, '.gsd'));
    assert.equal(openDatabase(join(base, '.gsd', 'gsd.db')), true);
    engine._getAdapter()!.prepare('UPDATE project_authority SET project_root_realpath = ? WHERE singleton = 1').run(base);
    closeDatabase();
    host = engine.openCoordinationMaintenanceHost({ projectDir: base });
    assert.throws(() => engine.inspectCutoverCoordination(base), /Generic database access is unavailable during coordination maintenance/);
    host.close();
    host = undefined;
    assert.equal(engine.inspectCutoverCoordination(base).reason, 'inspection-disabled');
    assert.equal(getDbOrNull(), null);
  } finally { host?.close(); closeDatabase(); rmSync(base, { recursive: true, force: true }); }
});
