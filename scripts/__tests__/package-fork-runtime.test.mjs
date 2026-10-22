import assert from 'node:assert/strict';
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
