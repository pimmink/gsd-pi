import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertPackageMetadata, assertReleaseContext } from '../package-fork-runtime.mjs';

const sha = 'a'.repeat(40);
const context = {
  GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'pimmink/gsd-pi',
  GITHUB_REF: 'refs/heads/release/runtime-1', GITHUB_SHA: sha,
  GITHUB_EVENT_NAME: 'workflow_dispatch',
};
const pkg = {
  name: '@opengsd/gsd-pi', version: '1.22.0-fork.4',
  files: ['dist', 'fork-release-manifest.json'],
  scripts: {
    prepack: 'node scripts/prepack-resolve-workspace.cjs',
    postpack: 'node scripts/postpack-restore-workspace.cjs',
  },
};

test('only exact personal-fork online release source is eligible', () => {
  assert.doesNotThrow(() => assertReleaseContext(context, sha));
  assert.doesNotThrow(() => assertReleaseContext({ ...context, GITHUB_EVENT_NAME: 'push' }, sha));
  for (const patch of [
    { GITHUB_ACTIONS: 'false' }, { GITHUB_REPOSITORY: 'open-gsd/gsd-pi' },
    { GITHUB_REF: 'refs/heads/main' }, { GITHUB_REF: 'refs/pull/1/merge' },
    { GITHUB_REF: 'refs/tags/release/runtime-1' }, { GITHUB_REF: 'refs/heads/release/runtime-' },
    { GITHUB_REF: 'refs/heads/release/runtime-1/extra' },
    { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_EVENT_NAME: 'merge_group' },
    { GITHUB_SHA: 'b'.repeat(40) },
  ]) {
    assert.throws(() => assertReleaseContext({ ...context, ...patch }, sha));
  }
  assert.throws(() => assertReleaseContext(context, sha.slice(0, 12)));
});

test('manifest inclusion, fork version and pack/restore lifecycle are mandatory', () => {
  assert.doesNotThrow(() => assertPackageMetadata(pkg, { version: pkg.version }));
  for (const patch of [
    { name: 'other' }, { version: '1.22.0' }, { files: ['dist'] },
    { scripts: { ...pkg.scripts, prepack: 'echo bypass' } },
    { scripts: { ...pkg.scripts, postpack: undefined } },
  ]) {
    assert.throws(() => assertPackageMetadata({ ...pkg, ...patch }, { version: pkg.version }));
  }
  assert.throws(() => assertPackageMetadata(pkg, { version: '1.22.0-fork.3' }));
});

// Interpret only this job's small condition grammar, never execute workflow text.
// Unknown clauses fail closed so a workflow change cannot silently escape coverage.
function evaluatePackageCondition(condition, values, { cancelled, ancestorResult }) {
  const clauses = condition.split(/\s*&&\s*/);
  const evaluateAtom = (atom) => {
    if (atom === '!cancelled()') return !cancelled;
    const equality = atom.match(/^([\w.-]+) == '([^']*)'$/);
    if (equality) {
      assert.ok(Object.hasOwn(values, equality[1]), `unknown context: ${equality[1]}`);
      return values[equality[1]] === equality[2];
    }
    const prefix = atom.match(/^startsWith\(([\w.-]+), '([^']*)'\)$/);
    if (prefix) {
      assert.ok(Object.hasOwn(values, prefix[1]), `unknown context: ${prefix[1]}`);
      return values[prefix[1]].startsWith(prefix[2]);
    }
    assert.fail(`unsupported package condition: ${atom}`);
  };
  const results = clauses.map((clause) => {
    const group = clause.startsWith('(') && clause.endsWith(')') ? clause.slice(1, -1) : clause;
    return group.split(/\s*\|\|\s*/).map(evaluateAtom).some(Boolean);
  });
  // GitHub implicitly adds success() unless the source contains a status function.
  const explicitStatus = /\b(?:success|failure|cancelled|always)\(/.test(condition);
  const implicitSuccess = !cancelled && ancestorResult === 'success' &&
    values['needs.build.result'] === 'success' && values['needs.ci-gate.result'] === 'success';
  return (explicitStatus || implicitSuccess) && results.every(Boolean);
}

test('package condition handles skipped ancestors without bypassing cancellation or release gates', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const job = workflow.split('  fork-runtime-package:\n')[1].split('  node22-smoke:\n')[0];
  const condition = job.match(/    if: >-\n([\s\S]*?)    runs-on:/)[1].trim().replace(/\s*\n\s*/g, ' ');
  const values = {
    'github.repository': 'pimmink/gsd-pi',
    'github.ref': 'refs/heads/release/runtime-1',
    'github.event_name': 'push',
    'needs.build.result': 'success',
    'needs.ci-gate.result': 'success',
  };
  for (const ancestorResult of ['skipped', 'success']) {
    for (const cancelled of [false, true]) {
      for (const event of ['push', 'workflow_dispatch']) {
        for (const build of ['success', 'failure', 'cancelled', 'skipped']) {
          for (const gate of ['success', 'failure', 'cancelled', 'skipped']) {
            const actual = evaluatePackageCondition(condition, {
              ...values, 'github.event_name': event,
              'needs.build.result': build, 'needs.ci-gate.result': gate,
            }, { cancelled, ancestorResult });
            assert.equal(actual, !cancelled && build === 'success' && gate === 'success',
              JSON.stringify({ ancestorResult, cancelled, event, build, gate }));
          }
        }
      }
    }
  }
  for (const patch of [
    { 'github.repository': 'open-gsd/gsd-pi' },
    { 'github.ref': 'refs/heads/main' },
    { 'github.ref': 'refs/tags/release/runtime-1' },
    { 'github.event_name': 'pull_request' },
    { 'github.event_name': 'merge_group' },
  ]) {
    assert.equal(evaluatePackageCondition(condition, { ...values, ...patch }, {
      cancelled: false, ancestorResult: 'skipped',
    }), false, JSON.stringify(patch));
  }
});

test('workflow packages only after successful build and aggregate CI, with bounded upload', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const job = workflow.split('  fork-runtime-package:\n')[1].split('  node22-smoke:\n')[0];
  assert.match(job, /needs: \[build, ci-gate\]/);
  assert.match(job, /github\.repository == 'pimmink\/gsd-pi'/);
  assert.match(job, /startsWith\(github\.ref, 'refs\/heads\/release\/runtime-'\)/);
  assert.match(job, /needs\.build\.result == 'success' && needs\.ci-gate\.result == 'success'/);
  assert.match(job, /retention-days: 7/);
  assert.match(job, /if-no-files-found: error/);
  assert.doesNotMatch(job, /npm publish|pnpm (install|build)|ignore-scripts=true/);
});

test('primary CI delegates only fork compiled units to four mandatory exact-source shards', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const build = workflow.split('\n  build:\n')[1].split('\n  fork-unit:\n')[0];
  const shards = workflow.split('\n  fork-unit:\n')[1]?.split('\n  windows-portability:\n')[0];
  assert.ok(shards, 'required primary unit matrix is missing');
  assert.match(build, /timeout-minutes: \$\{\{ github.repository == 'pimmink\/gsd-pi' && 75 \|\| 45 \}\}/);
  assert.match(build, /if: github.repository == 'pimmink\/gsd-pi' \|\| needs.fast-gates.outputs.heavy-code-changed == 'true'/);
  assert.match(build, /name: Run unit tests\n\s+if: github.repository != 'pimmink\/gsd-pi'/);
  assert.match(build, /ci-unit-shards.mjs prepare "\$GITHUB_SHA"/);
  assert.match(build, /find \. -type d -name node_modules -prune -print0/);
  assert.match(build, /tar czf ci-unit-shards.tar.gz dist dist-test packages\/\*\/dist/);
  assert.match(shards, /if: github.repository == 'pimmink\/gsd-pi'/);
  assert.match(shards, /needs: build/);
  assert.match(shards, /fail-fast: false/);
  assert.match(shards, /shard: \[0, 1, 2, 3\]/);
  assert.match(shards, /runs-on: ubuntu-24.04/);
  assert.match(build, /github.repository == 'pimmink\/gsd-pi' && 'ubuntu-24.04'/);
  assert.ok(build.includes("github.repository_owner == 'pimmink' && 'ubuntu-latest' || 'blacksmith-4vcpu-ubuntu-2404'"));
  assert.match(shards, /node-version: \$\{\{ needs.build.outputs.unit-node-version \}\}/);
  assert.match(shards, /pnpm exec node scripts\/ci-unit-shards.mjs run/);
  assert.match(shards, /\+\$\{GITHUB_SHA\}:refs\/checkout-ref/);
  assert.ok(shards.includes('[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]'));
  assert.match(shards, /name: ci-unit-shards/);
  assert.match(shards, /set -euo pipefail[\s\S]*ci-unit-shards.mjs run "\$GITHUB_SHA"/);
  assert.match(shards, /GSD_NATIVE_PREFER_LOCAL: '1'/);
  assert.doesNotMatch(shards, /continue-on-error|pnpm install|npm install|run-id:|github-token:/);
  assert.match(workflow, /needs: \[fast-gates, build, fork-unit, windows-portability, node22-smoke, workflow-lint\]/);
  for (const gate of ['test:packages:compiled', 'pnpm --filter @gsd/pi-ai test', 'test:unit:compiled:perf', 'test:daemon', 'test:integration', 'test:e2e', 'gate:g8-legacy-counters', 'test:e2e:docker']) assert.ok(build.includes(gate), gate);
});

test('ci-gate rejects failure, cancellation and skipped fork matrices but permits upstream skip', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const gate = workflow.split('\n  ci-gate:\n')[1];
  assert.match(gate, /if: always\(\)/);
  const script = gate.split('run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  for (const repo of ['pimmink/gsd-pi', 'open-gsd/gsd-pi']) {
    for (const result of ['success', 'failure', 'cancelled', 'skipped']) {
      const rendered = script.replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (_, expression) => {
        if (expression === 'github.repository') return repo;
        if (expression === 'needs.fork-unit.result') return result;
        if (/^needs\.[\w-]+\.result$/.test(expression)) return 'success';
        assert.fail(`unexpected gate expression: ${expression}`);
      });
      const run = spawnSync('bash', ['-c', rendered], { encoding: 'utf8', env: {
        ...process.env, REPOSITORY: repo, FORK_UNIT: result,
        FAST_GATES: 'success', BUILD: 'success', WINDOWS: 'success', NODE22: 'success', WORKFLOW_LINT: 'success',
      } });
      const expected = repo === 'pimmink/gsd-pi' ? result === 'success' : true;
      assert.equal(run.status === 0, expected, `${repo}: ${result}: ${run.stderr}`);
    }
  }
});
