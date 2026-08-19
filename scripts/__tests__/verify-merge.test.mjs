import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const verifyMergeScript = readFileSync("scripts/verify-merge.sh", "utf8");
const verifyMergeNeededScript = readFileSync("scripts/verify-merge-needed.sh", "utf8");

test("verify:merge compiles test artifacts once and reuses compiled suites", () => {
  assert.equal((verifyMergeScript.match(/pnpm run test:compile/g) ?? []).length, 1);
  assert.match(verifyMergeScript, /pnpm run test:unit:compiled/);
  assert.match(verifyMergeScript, /pnpm run test:packages:compiled/);
  assert.doesNotMatch(verifyMergeScript, /pnpm run test:unit\b(?!:compiled)/);
  assert.doesNotMatch(verifyMergeScript, /pnpm run test:packages\b(?!:compiled)/);
});

test("verify:merge uses the stale-aware web host build path", () => {
  assert.match(verifyMergeScript, /node scripts\/build-web-if-stale\.cjs/);
  assert.doesNotMatch(verifyMergeScript, /pnpm run build:web-host/);
});

test("verify:merge mirrors CI portability gating for native package tests", () => {
  assert.match(verifyMergeScript, /bash scripts\/ci-classify-changes\.sh/);
  assert.ok(
    verifyMergeScript.includes("PORTABILITY_CHANGED=\"$(sed -n 's/^portability-changed=//p'"),
  );
  assert.match(verifyMergeScript, /GSD_SKIP_NATIVE_PACKAGE_TESTS=0 pnpm run test:packages:compiled/);
  assert.match(verifyMergeScript, /GSD_SKIP_NATIVE_PACKAGE_TESTS=1 pnpm run test:packages:compiled/);
});

test("verify:merge preserves pre-existing required checks", () => {
  assert.match(verifyMergeScript, /pnpm --filter @gsd\/pi-ai test/);
  assert.match(verifyMergeScript, /pnpm run test:integration/);
  assert.match(verifyMergeScript, /pnpm run test:e2e/);
  assert.match(verifyMergeScript, /pnpm run validate-pack/);
  assert.match(verifyMergeScript, /pnpm run verify:workspace-coverage/);
  assert.match(verifyMergeScript, /pnpm run verify:extension-coverage/);
});

test("verify:merge:needed tolerates the literal `--` that `pnpm run ... -- --base` forwards", () => {
  // Reproduces the exact invocation documented in CONTRIBUTING.md / package.json:
  // `pnpm run verify:merge:needed -- --base <ref> --head <ref>` forwards a literal
  // leading `--` token to the underlying script (npm/pnpm do not strip it).
  const result = spawnSync(
    "bash",
    ["scripts/verify-merge-needed.sh", "--", "--base", "HEAD", "--head", "HEAD"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Base ref: HEAD/);
  assert.match(result.stdout, /Head ref: HEAD/);
});

test("verify:merge:needed script is exposed in package.json and reuses CI classification", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["verify:merge:needed"], "bash scripts/verify-merge-needed.sh");
  assert.match(verifyMergeNeededScript, /bash scripts\/ci-classify-changes\.sh/);
  assert.match(verifyMergeNeededScript, /VERIFY_MERGE_VERBOSE/);
  assert.match(verifyMergeNeededScript, /verify:merge is not required/);
  assert.match(verifyMergeNeededScript, /verify:merge is required/);
});
