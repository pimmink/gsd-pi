import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkGitHubMarkdown } from "../check-github-markdown.mjs";
import { findContractChanges } from "../rebase-contract-sweep.mjs";
import { classifyReviewThreads } from "../review-follow-up-contract.mjs";

const exec = promisify(execFile);
const testDir = dirname(fileURLToPath(import.meta.url));
const scripts = resolve(testDir, "..");
const governanceRoot = resolve(testDir, "../..");
const snapshotWorktree = resolve(governanceRoot, "../project-snapshot-db-handle");

test("Markdown preflight accepts an approved Mermaid block with prose", () => {
  const findings = checkGitHubMarkdown("Summary.\n\n```mermaid\nflowchart LR\nbase[Base] --> consumer[Consumer]\n```\n");
  assert.deepEqual(findings, []);
});

test("Markdown preflight rejects an unclosed Mermaid block", () => {
  const findings = checkGitHubMarkdown("```mermaid\nflowchart LR\n  base[Base]\n");
  assert.ok(findings.some((finding) => finding.message === "unclosed Mermaid block"));
});

test("Markdown preflight rejects unsupported diagrams and duplicate identifiers", () => {
  const findings = checkGitHubMarkdown("Summary.\n\n```mermaid\nclassDiagram\nbase[Base]\nbase[Duplicate]\n```\n");
  assert.ok(findings.some((finding) => finding.message === "unsupported Mermaid diagram type"));
  assert.ok(findings.some((finding) => finding.message === "duplicate Mermaid identifier: base"));
});

test("Markdown preflight reports unsafe content and missing adjacent prose", () => {
  const findings = checkGitHubMarkdown("```mermaid\nflowchart LR\nbase[https://example.invalid]\n```\n");
  assert.ok(findings.some((finding) => finding.level === "warning" && finding.message.includes("may not render")));
  assert.ok(findings.some((finding) => finding.message === "diagram has no adjacent prose summary"));
});

test("Markdown preflight rejects unsafe identifiers and unquoted punctuation labels", () => {
  const findings = checkGitHubMarkdown("Summary.\n\n```mermaid\nflowchart LR\n#2102[Needs review (now)]\n```\n");
  assert.ok(findings.some((finding) => finding.message.includes("unsafe Mermaid identifier")));
  assert.ok(findings.some((finding) => finding.message === "Mermaid labels with punctuation must be quoted"));
});

test("runtime receipt checker accepts a matching fresh artifact", async () => {
  const worktree = process.cwd();
  const sha = (await exec("git", ["rev-parse", "HEAD"])).stdout.trim();
  const temp = await mkdtemp("/tmp/runtime-receipt-");
  const artifact = join(temp, "runtime.js");
  await writeFile(artifact, "runtime");
  const relativeArtifact = artifact.startsWith(worktree) ? artifact.slice(worktree.length + 1) : artifact;
  const receipt = join(temp, "receipt.json");
  await writeFile(receipt, JSON.stringify({ sourceSha: sha, artifactPath: relativeArtifact, activationLayer: "built-cli", probe: { status: "pass" } }));
  const result = await exec(process.execPath, [join(scripts, "check-runtime-receipt.mjs"), receipt, worktree]);
  assert.match(result.stdout, /"status": "current"/);
});

test("runtime receipt checker flags a stale SHA", async () => {
  const worktree = process.cwd();
  const temp = await mkdtemp("/tmp/runtime-receipt-");
  const receipt = join(temp, "receipt.json");
  await writeFile(receipt, JSON.stringify({ sourceSha: "0".repeat(40), activationLayer: "built-cli", probe: { status: "pass" } }));
  await assert.rejects(
    exec(process.execPath, [join(scripts, "check-runtime-receipt.mjs"), receipt, worktree]),
    (error) => error.code === 1,
  );
});

test("contribution snapshot reports the selected worktree and register references", async () => {
  const { stdout } = await exec(
    process.execPath,
    [join(scripts, "contribution-snapshot.mjs"), "GSD-W035", snapshotWorktree],
    { cwd: governanceRoot },
  );
  const snapshot = JSON.parse(stdout);
  assert.equal(snapshot.workRegisterId, "GSD-W035");
  assert.equal(snapshot.worktree, "worktrees/project-snapshot-db-handle");
  assert.ok(Array.isArray(snapshot.references.pullRequests));
  assert.equal(snapshot.pullRequest.status, "unknown");
  assert.equal(snapshot.remoteHeadMatchesLocal, null);
  assert.deepEqual(snapshot.patch, { status: "not-supplied" });
  assert.equal(typeof snapshot.identity.name, "string");
  assert.equal(typeof snapshot.identity.emailPresent, "boolean");
  assert.deepEqual(snapshot.cleanRunnerRunIds, []);
  assert.ok(Array.isArray(snapshot.dirty.staged));
  assert.ok(Array.isArray(snapshot.dirty.unstaged));
  assert.ok(Array.isArray(snapshot.dirty.untracked));
  assert.match(snapshot.headSha, /^[0-9a-f]{40}$/);
  assert.match(snapshot.upstreamRelation, /^\d+\s+\d+$/);

  const { stdout: comparedStdout } = await exec(
    process.execPath,
    [
      join(scripts, "contribution-snapshot.mjs"),
      "GSD-W035",
      snapshotWorktree,
      "2172",
      "--remote-head",
      snapshot.headSha,
    ],
    { cwd: governanceRoot },
  );
  const compared = JSON.parse(comparedStdout);
  assert.equal(compared.remoteHeadSource, "supplied");
  assert.equal(compared.remoteHeadMatchesLocal, true);
});

test("rebase contract sweep detects API, RPC, constructor, factory, and mock changes", () => {
  const changes = findContractChanges("+ export function registerRuntimeRead(handler) { }\n+ interface ProgressContract { getProjectProgress(): void }\n+ setRuntimeRead(value)\n+ command: \"get_project_progress\"\n+ constructor(options)\n+ createRuntimeMock()\n+ mockProgress = { value: 1 }\n- getOldValue()\n");
  assert.deepEqual(changes.addedApiNames, ["registerRuntimeRead", "getProjectProgress", "setRuntimeRead"]);
  assert.deepEqual(changes.rpcLiterals, ["get_project_progress"]);
  assert.equal(changes.constructorChanges.length, 1);
  assert.equal(changes.mockFactoryChanges.length, 1);
  assert.equal(changes.objectLiteralCallSites.length, 1);
});

test("rebase contract sweep reports no APIs for an unrelated fixed diff", async () => {
  const { stdout } = await exec(
    process.execPath,
    [join(scripts, "rebase-contract-sweep.mjs"), "HEAD~1"],
    { cwd: governanceRoot },
  );
  const sweep = JSON.parse(stdout);
  assert.equal(sweep.status, "advisory");
  assert.deepEqual(sweep.addedApiNames, []);
  assert.deepEqual(sweep.rpcLiterals, []);
});

test("review follow-up classifier keeps thread decisions read-only", () => {
  assert.deepEqual(classifyReviewThreads([
    { id: "valid", status: "open" },
    { id: "stale", status: "resolved" },
    { id: "duplicate", status: "open", duplicateOf: "valid" },
    { id: "decision", status: "open", needsMaintainerDecision: true },
  ]), [
    { id: "valid", classification: "valid" },
    { id: "stale", classification: "stale" },
    { id: "duplicate", classification: "duplicate", relatedTo: "valid" },
    { id: "decision", classification: "maintainer-decision-needed" },
  ]);
});