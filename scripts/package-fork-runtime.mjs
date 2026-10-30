#!/usr/bin/env node
// Personal-fork CI packaging only. Never builds, installs, publishes, or repairs source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PACKAGE_BYTES = 512 * 1024 * 1024;

export function assertReleaseContext(env, sourceSHA) {
  assert.equal(env.GITHUB_ACTIONS, 'true', 'Packaging is online CI only');
  assert.equal(env.GITHUB_REPOSITORY, 'pimmink/gsd-pi', 'Personal fork only');
  assert.match(env.GITHUB_REF ?? '', /^refs\/heads\/release\/runtime-[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Release branch only');
  assert.match(sourceSHA, /^[a-f0-9]{40}$/, 'Expected exact source SHA');
  assert.equal(sourceSHA, env.GITHUB_SHA, 'Checkout must match workflow source SHA');
  assert.ok(['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME), 'No PR or merge-group packaging');
}

export function assertPackageMetadata(pkg, manifest) {
  assert.equal(pkg.name, '@opengsd/gsd-pi');
  assert.match(pkg.version, /^\d+\.\d+\.\d+-fork\.\d+$/, 'Personal fork version required');
  assert.equal(manifest.version, pkg.version, 'Fork manifest version must match root version');
  assert.ok(pkg.files?.includes('fork-release-manifest.json'), 'Parent must include fork manifest in root files');
  assert.equal(pkg.scripts?.prepack, 'node scripts/prepack-resolve-workspace.cjs');
  assert.equal(pkg.scripts?.postpack, 'node scripts/postpack-restore-workspace.cjs');
}

export function packageForkRuntime(env = process.env) {
  const run = (command, args) => execFileSync(command, args, {
    cwd: ROOT, encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024,
  }).trim();
  const sourceSHA = run('git', ['rev-parse', 'HEAD']);
  assertReleaseContext(env, sourceSHA);
  const clean = () => {
    // Include untracked source; ignored build outputs are intentionally allowed.
    assert.equal(run('git', ['status', '--porcelain=v1', '--untracked-files=all']), '', 'Source must be clean');
    assert.equal(run('git', ['rev-parse', 'HEAD']), sourceSHA, 'Source revision changed');
    assert.ok(!existsSync(join(ROOT, '.prepack-backup')), 'Stale prepack backup must not be reused');
  };
  clean();
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(ROOT, 'fork-release-manifest.json'), 'utf8'));
  assertPackageMetadata(pkg, manifest);
  assert.ok(env.RUNNER_TEMP, 'RUNNER_TEMP required');
  const output = join(resolve(env.RUNNER_TEMP), 'fork-runtime-package');
  assert.ok(!existsSync(output), 'Artifact directory must be new');
  mkdirSync(output);
  try {
    // Explicitly enable the existing prepack/prepare/postpack lifecycle.
    execFileSync('npm', ['pack', '--ignore-scripts=false', '--pack-destination', output], {
      cwd: ROOT, stdio: 'inherit', timeout: 300_000,
    });
  } finally {
    // Never upload a tarball if postpack failed to restore tracked source.
    clean();
  }
  const filename = `opengsd-gsd-pi-${pkg.version}.tgz`;
  assert.deepEqual(readdirSync(output), [filename], 'Expected exactly the known npm tarball');
  const archive = join(output, filename);
  assert.ok(statSync(archive).isFile());
  const size = statSync(archive).size;
  assert.ok(size > 0 && size <= MAX_PACKAGE_BYTES, 'Package exceeds 512 MiB bound');
  const packedJSON = (path) => JSON.parse(run('tar', ['-xOf', archive, `package/${path}`]));
  const packedRoot = packedJSON('package.json');
  assert.equal(packedRoot.name, pkg.name);
  assert.equal(packedRoot.version, pkg.version);
  assert.deepEqual(packedJSON('fork-release-manifest.json'), manifest, 'Pack must contain exact fork manifest');
  const entries = new Set(run('tar', ['-tzf', archive]).split('\n'));
  for (const path of ['dist/bootstrap.js', 'dist/loader.js']) {
    assert.ok(entries.has(`package/${path}`), `Missing installable runtime file: ${path}`);
  }
  for (const entry of entries) {
    // Only our release manifests: bundled vendors may retain development-only
    // workspace ranges and must not cause thousands of tar subprocesses here.
    if (entry === 'package/package.json' || /^package\/packages\/[^/]+\/package\.json$/.test(entry)
      || entry === 'package/dist/web/standalone/package.json') {
      const metadata = packedJSON(entry.slice('package/'.length));
      for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
        for (const value of Object.values(metadata[field] ?? {})) {
          assert.ok(!String(value).startsWith('workspace:'), `Unresolved workspace dependency in ${entry}`);
        }
      }
    }
  }
  const bytes = readFileSync(archive);
  const provenance = {
    schemaVersion: 1,
    sourceSHA,
    repository: env.GITHUB_REPOSITORY,
    ref: env.GITHUB_REF,
    rootVersion: pkg.version,
    workflowRun: {
      id: env.GITHUB_RUN_ID,
      attempt: env.GITHUB_RUN_ATTEMPT,
      url: `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
    },
    createdAt: new Date().toISOString(),
    file: {
      name: filename, bytes: size,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sha512: createHash('sha512').update(bytes).digest('hex'),
    },
    toolchain: {
      node: process.version, npm: run('npm', ['--version']), pnpm: run('pnpm', ['--version']),
      platform: process.platform, arch: process.arch,
    },
    forkManifest: manifest,
    limits: {
      packageBytes: MAX_PACKAGE_BYTES,
      // This is provenance, not a claim of reproducible or cross-platform builds.
      reproducibleBuildVerified: false,
      runtimeInstallationVerified: false,
    },
  };
  clean();
  writeFileSync(join(output, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`, { flag: 'wx' });
  console.log(`Personal fork package verified: ${filename} (${size} bytes), source ${sourceSHA}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  packageForkRuntime();
}
