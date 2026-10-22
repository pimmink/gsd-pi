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
