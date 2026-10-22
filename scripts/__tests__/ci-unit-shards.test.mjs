import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertShardResult, createManifest, parseCommand, runShard, validateManifest } from '../ci-unit-shards.mjs';

const sha = 'a'.repeat(40);
const args = ['--import', './scripts/dist-test-resolve.mjs', '--experimental-test-isolation=process', '--test-reporter=./scripts/test-reporter-compact.mjs', '--test'];
const command = `node ${args.join(' ')} "dist-test/tests/*.test.js" "dist-test/more/*.test.mjs"`;

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'ci-unit-shards-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'dist-test/tests', 'dist-test/more']) mkdirSync(path.join(root, dir), { recursive: true });
  writeFileSync(path.join(root, 'scripts/dist-test-resolve.mjs'), '');
  writeFileSync(path.join(root, 'scripts/test-reporter-compact.mjs'), readFileSync(new URL('../test-reporter-compact.mjs', import.meta.url)));
  for (let i = 0; i < 5; i++) writeFileSync(path.join(root, `dist-test/tests/${i}.test.js`), "require('node:test')('tiny', () => {});\n");
  writeFileSync(path.join(root, 'dist-test/more/extra.test.mjs'), "import { test } from 'node:test'; test('extra', () => {});\n");
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { 'test:unit:compiled': command } }));
  return root;
}

test('canonical command preserves resolver, isolation, reporter and every glob', () => {
  assert.deepEqual(parseCommand(command), { nodeArgs: args, globs: ['dist-test/tests/*.test.js', 'dist-test/more/*.test.mjs'] });
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)));
  const parsed = parseCommand(pkg.scripts['test:unit:compiled']);
  assert.ok(parsed.globs.length > 0);
  assert.equal(`node ${parsed.nodeArgs.join(' ')} ${parsed.globs.map(g => `"${g}"`).join(' ')}`, pkg.scripts['test:unit:compiled']);
});

test('full coverage, deterministic uneven round-robin, SHA binding and no duplicates', t => {
  const root = fixture(t);
  const manifest = createManifest(root, sha);
  assert.deepEqual(manifest.shards.map(s => s.length), [2, 2, 1, 1]);
  assert.equal(new Set(manifest.shards.flat()).size, manifest.files.length);
  assert.deepEqual([...manifest.shards.flat()].sort(), manifest.files);
  assert.deepEqual(validateManifest(root, manifest, sha), manifest);
  assert.throws(() => validateManifest(root, manifest, 'b'.repeat(40)), /source/i);
  for (const mutate of [
    m => m.shards[0].push(m.shards[1][0]),
    m => m.shards[0].pop(),
    m => m.shards.reverse(),
    m => m.files.push(m.files[0]),
    m => m.nodeArgs.push('--force-exit'),
    m => { m.nodeVersion = 'v0.0.0'; },
    m => { m.arch = 'wrong-native-architecture'; },
    m => { m.shards[0] = []; },
    m => { m.files[0] = '../escape.test.js'; },
  ]) {
    const broken = structuredClone(manifest);
    mutate(broken);
    assert.throws(() => validateManifest(root, broken, sha), /manifest|coverage/i);
  }
  assert.throws(() => validateManifest(root, null, sha), /manifest/i);
});

test('rejects unsupported commands, flags, empty/missing/unsafe/duplicate globs', t => {
  const root = fixture(t);
  for (const bad of [
    '', 'pnpm test', command + ' && echo unsafe', command.replace('--test ', '--test --force-exit '),
    command.replace('*.test.js', '**/*.test.js'), command.replace('dist-test/tests', '../tests'),
    command + ' "dist-test/tests/*.test.js"', command.replace('--import', '--require'),
  ]) assert.throws(() => parseCommand(bad), /command|glob|flag|duplicate/i, bad);
  for (const bad of [command.replace('dist-test/tests', 'dist-test/missing'), command + ' "dist-test/more/*.test.js"']) {
    assert.throws(() => createManifest(root, sha, bad), /missing|empty/i);
  }
  assert.throws(() => createManifest(root, 'not-a-sha'), /source/i);
  symlinkSync(path.join(root, 'dist-test/tests'), path.join(root, 'dist-test/link'));
  assert.throws(() => createManifest(root, sha, command + ' "dist-test/link/*.test.js"'), /unsafe|symlink/i);
  rmSync(path.join(root, 'dist-test/more/extra.test.mjs'));
  symlinkSync(path.join(root, 'scripts/dist-test-resolve.mjs'), path.join(root, 'dist-test/more/extra.test.mjs'));
  assert.throws(() => createManifest(root, sha), /unsafe|symlink/i);
});

test('missing compiled files and changed canonical command invalidate downloaded manifest', t => {
  const root = fixture(t);
  const manifest = createManifest(root, sha);
  rmSync(path.join(root, manifest.files[0]));
  assert.throws(() => validateManifest(root, manifest, sha), /manifest|coverage|missing|empty/i);
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { 'test:unit:compiled': command.replace('process', 'none') } }));
  assert.throws(() => validateManifest(root, manifest, sha));
});

test('rejects missing canonical command and partitions that would contain an empty shard', t => {
  const root = fixture(t);
  for (let i = 1; i < 5; i++) rmSync(path.join(root, `dist-test/tests/${i}.test.js`));
  assert.throws(() => createManifest(root, sha), /empty shard/i);
  writeFileSync(path.join(root, 'package.json'), '{}');
  assert.throws(() => createManifest(root, sha), /command/i);
});

test('nonempty test summary, cancellation and exit failures fail closed', () => {
  assert.doesNotThrow(() => assertShardResult({ code: 0, signal: null, output: '✔ 2 passed, 0 failed, 1 skipped\n' }));
  for (const result of [
    { code: 0, signal: 'SIGTERM', output: '✔ 1 passed, 0 failed, 0 skipped' },
    { code: null, signal: 'SIGINT', output: '' },
    { code: 7, signal: null, output: '✔ 1 passed, 0 failed, 0 skipped' },
    { code: 0, signal: null, output: '' },
    { code: 0, signal: null, output: '✔ 0 passed, 0 failed, 0 skipped' },
    { code: 0, signal: null, output: '✖ 1 passed, 1 failed, 0 skipped' },
    { code: 0, signal: null, output: '✖ 1 passed, 0 failed, 0 skipped' },
    { code: 0, signal: null, output: '✔ 0 passed, 0 failed, 4 skipped' },
    { code: 0, signal: null, output: '✔ 1 passed, 0 failed, 0 skipped\n✔ 1 passed, 0 failed, 0 skipped' },
    { code: 0, signal: null, output: '✖ 1 passed, 1 failed, 0 skipped\n✔ 1 passed, 0 failed, 0 skipped' },
  ]) assert.throws(() => assertShardResult(result), /exit|cancel|summary|fail/i);
});

test('tiny synthetic Node shard preserves flags and propagates real test failure', async t => {
  const root = fixture(t);
  const manifest = createManifest(root, sha);
  // A fresh CLI process has no test-runner parent context. Do not let the
  // fixture subprocess inherit node:test's recursive-run suppression marker.
  const run = () => {
    const context = process.env.NODE_TEST_CONTEXT;
    delete process.env.NODE_TEST_CONTEXT;
    try { return runShard(root, manifest, sha, 0); }
    finally { if (context !== undefined) process.env.NODE_TEST_CONTEXT = context; }
  };
  await run();
  writeFileSync(path.join(root, manifest.shards[0][0]), "require('node:test')('broken', () => { throw Error('synthetic failure'); });\n");
  await assert.rejects(run(), /exit 1/);
  for (const shard of [-1, 4, 0.5, NaN]) await assert.rejects(runShard(root, manifest, sha, shard), /shard/i);
});

test('CLI prepares source-bound synthetic manifest and rejects missing, stale or unsupported inputs', t => {
  const root = fixture(t);
  const cli = fileURLToPath(new URL('../ci-unit-shards.mjs', import.meta.url));
  const run = args => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(run(['prepare', sha, 'manifest.json']).status, 0);
  assert.equal(JSON.parse(readFileSync(path.join(root, 'manifest.json'))).sourceSha, sha);
  for (const args of [
    ['prepare', 'bad-sha', 'manifest.json'], ['prepare', sha, 'manifest.json', '0'],
    ['run', 'b'.repeat(40), 'manifest.json', '0'], ['run', sha, 'missing.json', '0'],
    ['run', sha, 'manifest.json', '-1'], ['unknown', sha, 'manifest.json'], [],
  ]) assert.equal(run(args).status, 1, args.join(' '));
});

for (const relative of ['scripts/dist-test-resolve.mjs', 'scripts/test-reporter-compact.mjs']) {
  test(`rejects symlinked executable ${relative} at preparation and consumption`, t => {
    const root = fixture(t);
    const manifest = createManifest(root, sha);
    const outside = mkdtempSync(path.join(os.tmpdir(), 'ci-shard-outside-'));
    t.after(() => rmSync(outside, { recursive: true, force: true }));
    const target = path.join(outside, 'external.mjs');
    writeFileSync(target, 'throw Error("must never execute external helper");\n');
    rmSync(path.join(root, relative));
    symlinkSync(target, path.join(root, relative));
    assert.throws(() => createManifest(root, sha), /unsafe|symlink/i);
    assert.throws(() => validateManifest(root, manifest, sha), /unsafe|symlink/i);
  });
}

function cliEnvironment() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

test('CLI healthy shard passes and genuinely failing test returns nonzero', t => {
  const root = fixture(t);
  const cli = fileURLToPath(new URL('../ci-unit-shards.mjs', import.meta.url));
  const manifest = createManifest(root, sha);
  writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
  const run = () => spawnSync(process.execPath, [cli, 'run', sha, 'manifest.json', '0'], {
    cwd: root, env: cliEnvironment(), encoding: 'utf8', timeout: 20000,
  });
  const healthy = run();
  assert.equal(healthy.status, 0, healthy.stderr);
  writeFileSync(path.join(root, manifest.shards[0][0]), "require('node:test')('CLI broken', () => { throw Error('CLI failure'); });\n");
  const failed = run();
  assert.equal(failed.status, 1, failed.stderr);
  assert.match(failed.stderr, /Shard exit 1/);
});

test('CLI forwards cancellation after a child readiness marker and rejects it', { timeout: 25000 }, async t => {
  const root = fixture(t);
  const marker = path.join(root, 'child-ready');
  // Block preloading before the test runner can spawn grandchildren. The timer
  // also bounds this fixture if cancellation itself ever regresses.
  writeFileSync(path.join(root, 'scripts/dist-test-resolve.mjs'),
    `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'ready'); await new Promise(r => setTimeout(r, 20000));\n`);
  writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(createManifest(root, sha)));
  const cli = fileURLToPath(new URL('../ci-unit-shards.mjs', import.meta.url));
  const child = spawn(process.execPath, [cli, 'run', sha, 'manifest.json', '0'], {
    cwd: root, env: cliEnvironment(), stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data; });
  let closed = false;
  const result = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => { closed = true; resolve({ code, signal }); });
  });
  const deadline = Date.now() + 15000;
  try {
    while (!existsSync(marker)) {
      assert.ok(!closed && Date.now() < deadline, `Child failed to become ready: ${stderr}`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.ok(child.kill('SIGTERM'));
    const ended = await result;
    assert.equal(ended.signal, null);
    assert.equal(ended.code, 1);
    assert.match(stderr, /cancelled/i);
  } finally {
    if (!closed) child.kill('SIGTERM');
    await result;
  }
});

test('script policy discovers helper tests in its normal scripts glob', () => {
  const policy = readFileSync(new URL('../ci-fast-gates.sh', import.meta.url), 'utf8');
  assert.ok(policy.includes('"scripts/__tests__/*.mjs"'));
  assert.ok(fileURLToPath(import.meta.url).endsWith('/scripts/__tests__/ci-unit-shards.test.mjs'));
});
