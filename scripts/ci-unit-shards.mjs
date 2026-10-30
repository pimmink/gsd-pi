#!/usr/bin/env node
// Primary CI only: canonical package command -> source-bound manifest -> four
// round-robin partitions. Never accept a hand-maintained test list or receipt.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { globSync, lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHARDS = 4;
const SHA = /^[0-9a-f]{40}$/;
const LOCAL_SCRIPT = /^\.\/scripts\/[a-zA-Z0-9_-]+\.mjs$/;
const GLOB = /^dist-test\/(?:[a-zA-Z0-9_-]+\/)+\*\.test\.(?:js|mjs)$/;

export function parseCommand(command) {
  if (typeof command !== 'string' || !command.startsWith('node ')) throw new Error('Unsupported canonical command');
  // Deliberately a narrow grammar, not a shell interpreter. Fail closed when
  // package.json grows new flags/operators until equivalence is reviewed.
  const split = command.indexOf(' "');
  if (split < 0) throw new Error('Canonical command has no quoted globs');
  const nodeArgs = command.slice(5, split).split(' ');
  let i = 0;
  if (nodeArgs[i++] !== '--import' || !LOCAL_SCRIPT.test(nodeArgs[i++])) throw new Error('Unsupported import flag');
  if (nodeArgs[i++] !== '--experimental-test-isolation=process') throw new Error('Unsupported isolation flag');
  const reporter = nodeArgs[i++]?.replace(/^--test-reporter=/, '');
  if (!LOCAL_SCRIPT.test(reporter ?? '')) throw new Error('Unsupported reporter flag');
  if (nodeArgs[i++] !== '--test' || i !== nodeArgs.length) throw new Error('Unsupported Node flags');
  const suffix = command.slice(split + 1);
  const globs = [...suffix.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  if (!globs.length || globs.map(g => `"${g}"`).join(' ') !== suffix || !globs.every(g => GLOB.test(g))) throw new Error('Unsupported or unsafe canonical globs');
  if (new Set(globs).size !== globs.length) throw new Error('Duplicate canonical glob');
  return { nodeArgs, globs };
}

export function createManifest(root, sourceSha, command) {
  if (!SHA.test(sourceSha ?? '')) throw new Error('Invalid source SHA');
  command ??= JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).scripts?.['test:unit:compiled'];
  const { nodeArgs, globs } = parseCommand(command);
  const realRoot = realpathSync(root) + path.sep;
  // Resolver and reporter are executable inputs too. Recomputed consumer
  // manifests repeat this check, including changes after producer preparation.
  for (const relative of [nodeArgs[1], nodeArgs[3].slice('--test-reporter='.length)]) {
    const absolute = path.join(root, relative);
    if (!lstatSync(absolute).isFile() || realpathSync(absolute) !== path.join(realRoot, relative)) throw new Error(`Unsafe executable helper or symlink: ${relative}`);
  }
  const files = [];
  for (const glob of globs) {
    const matches = globSync(glob, { cwd: root }).sort();
    if (!matches.length) throw new Error(`Missing or empty canonical glob: ${glob}`);
    for (const file of matches) {
      const absolute = path.join(root, file);
      if (!lstatSync(absolute).isFile() || realpathSync(absolute) !== path.join(realRoot, file)) throw new Error(`Unsafe file or symlink: ${file}`);
      if (files.includes(file)) throw new Error(`Duplicate canonical file: ${file}`);
      files.push(file);
    }
  }
  files.sort();
  const shards = Array.from({ length: SHARDS }, (_, index) => files.filter((_, n) => n % SHARDS === index));
  if (shards.some(s => !s.length)) throw new Error('Empty shard: fewer compiled files than shards');
  assert.deepEqual([...shards.flat()].sort(), files, 'Shard coverage must equal canonical set');
  assert.equal(new Set(shards.flat()).size, files.length, 'Duplicate shard coverage');
  return { version: 1, sourceSha, nodeVersion: process.version, platform: process.platform, arch: process.arch, nodeArgs, globs, files, shards };
}

export function validateManifest(root, manifest, sourceSha) {
  if (!manifest || manifest.sourceSha !== sourceSha) throw new Error('Manifest source SHA mismatch');
  const canonical = createManifest(root, sourceSha);
  assert.deepEqual(manifest, canonical, 'Manifest coverage, command or runtime differs from canonical source');
  return manifest;
}

export function assertShardResult({ code, signal, output }) {
  if (signal) throw new Error(`Shard cancelled by ${signal}`);
  if (code !== 0) throw new Error(`Shard exit ${code}`);
  const summaries = [...output.matchAll(/^([✔✖]) (\d+) passed, (\d+) failed, (\d+) skipped$/gm)];
  const summary = summaries[0];
  // Required release shards must actually execute a passing test. An all-skip
  // result or multiple/conflicting summaries is not unambiguous execution proof.
  if (summaries.length !== 1 || summary[1] !== '✔' || Number(summary[2]) === 0 || Number(summary[3]) !== 0) throw new Error('Missing, ambiguous, empty or failed shard test summary');
}

export async function runShard(root, manifest, sourceSha, index) {
  validateManifest(root, manifest, sourceSha);
  if (!Number.isInteger(index) || index < 0 || index >= SHARDS) throw new Error('Invalid shard index');
  const files = manifest.shards[index];
  console.log(`Source ${sourceSha}: shard ${index + 1}/${SHARDS}, ${files.length}/${manifest.files.length} canonical files`);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...manifest.nodeArgs, ...files], { cwd: root, stdio: ['inherit', 'pipe', 'inherit'] });
    let output = '';
    let cancelled = false;
    const forward = signal => { cancelled = true; child.kill(signal); };
    const onTerm = () => forward('SIGTERM');
    const onInt = () => forward('SIGINT');
    process.on('SIGTERM', onTerm);
    process.on('SIGINT', onInt);
    const cleanup = () => { process.off('SIGTERM', onTerm); process.off('SIGINT', onInt); };
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { process.stdout.write(chunk); output = (output + chunk).slice(-16384); });
    child.on('error', error => { cleanup(); reject(error); });
    child.on('close', (code, signal) => {
      cleanup();
      try {
        assertShardResult({ code, signal: cancelled ? 'workflow cancellation' : signal, output });
        resolve();
      } catch (error) {
        error.exitCode = Number.isInteger(code) && code > 0 ? code : 1;
        reject(error);
      }
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, sourceSha, filename, index, ...extra] = process.argv.slice(2);
    if (extra.length || !filename) throw new Error('Usage: ci-unit-shards.mjs prepare|run SHA manifest.json [0..3]');
    if (mode === 'prepare' && index === undefined) {
      const manifest = createManifest(process.cwd(), sourceSha);
      writeFileSync(filename, JSON.stringify(manifest, null, 2) + '\n');
      console.log(`Canonical manifest: ${manifest.files.length} files, shards ${manifest.shards.map(s => s.length).join('/')}, source ${sourceSha}`);
    } else if (mode === 'run' && /^[0-3]$/.test(index ?? '')) {
      await runShard(process.cwd(), JSON.parse(readFileSync(filename, 'utf8')), sourceSha, Number(index));
    } else throw new Error('Unsupported command or shard index');
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode ?? 1;
  }
}
