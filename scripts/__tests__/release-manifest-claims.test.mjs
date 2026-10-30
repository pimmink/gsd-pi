import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('release manifest reports the verified build gate without overstating runtime verification', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../fork-release-manifest.json', import.meta.url), 'utf8'));
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const job = workflow.split('  fork-runtime-package:\n')[1].split('  node22-smoke:\n')[0];

  assert.deepEqual(manifest.verificationClaims, {
    buildPassed: true,
    runtimeInstallationVerified: false,
    liveProviderBehaviorVerified: false,
  });
  assert.match(job, /needs: \[build, ci-gate\]/);
  assert.match(job, /needs\.build\.result == 'success' && needs\.ci-gate\.result == 'success'/);
});
