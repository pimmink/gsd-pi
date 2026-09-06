#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const argumentsList = process.argv.slice(2);
const takeOption = (name) => {
  const index = argumentsList.indexOf(name);
  if (index === -1) return undefined;
  const value = argumentsList[index + 1];
  if (!value) {
    throw new Error(`missing value for ${name}`);
  }
  argumentsList.splice(index, 2);
  return value;
};
const requestedPatch = takeOption("--patch");
const requestedRemoteHead = takeOption("--remote-head");
const [workRegisterId, requestedWorktree, requestedPullRequest] = argumentsList;
if (!workRegisterId || !requestedWorktree || argumentsList.length > 3) {
  throw new Error("usage: contribution-snapshot.mjs <GSD-W###> <feature-worktree> [pull-request] [--patch <patch-file>] [--remote-head <sha>]");
}
if (requestedRemoteHead && !/^[0-9a-f]{7,40}$/i.test(requestedRemoteHead)) {
  throw new Error("remote head must be a Git SHA");
}

const governanceRoot = resolve(process.cwd());
const workspaceRoot = resolve(governanceRoot, "../..");
const allowedRoot = resolve(workspaceRoot, "worktrees");
const worktree = resolve(requestedWorktree);
if (!worktree.startsWith(`${allowedRoot}${sep}`)) throw new Error("feature worktree is outside the allowlisted worktrees directory");

const git = (args) => execFileSync("git", ["-C", worktree, ...args], { encoding: "utf8" }).trim();
const optional = (command, args) => {
  try {
    return execFileSync(command, args, { cwd: worktree, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const patchId = (content) => {
  try {
    const output = execFileSync("git", ["patch-id", "--stable"], {
      input: content,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return output.split(/\s+/)[0] || null;
  } catch {
    return null;
  }
};

const startHead = git(["rev-parse", "HEAD"]);
const statusLines = git(["status", "--porcelain=v1"]).split("\n").filter(Boolean);
const dirty = {
  staged: statusLines.filter((line) => line.slice(0, 1) !== " " && line.slice(0, 2) !== "??").map((line) => line.slice(3)),
  unstaged: statusLines.filter((line) => line.slice(1, 2) !== " " && line.slice(0, 2) !== "??").map((line) => line.slice(3)),
  untracked: statusLines.filter((line) => line.slice(0, 2) === "??").map((line) => line.slice(3)),
};
const register = JSON.parse(await readFile(resolve(governanceRoot, "docs/work-register.json"), "utf8"));
const item = register.items.filter((entry) => entry.id === workRegisterId);
if (item.length !== 1) throw new Error(`expected exactly one register item for ${workRegisterId}`);
const pullRequest = requestedPullRequest || item[0].pullRequests?.[0];
let pullRequestState = { status: "unknown", reason: "no pull request supplied" };
if (pullRequest) {
  const raw = optional("gh", ["pr", "view", String(pullRequest), "--json", "state,isDraft,mergeable,headRefOid,statusCheckRollup,url"]);
  if (raw) {
    try {
      pullRequestState = { status: "observed", ...JSON.parse(raw) };
    } catch {
      pullRequestState = { status: "unknown", reason: "GitHub CLI returned invalid JSON" };
    }
  } else {
    pullRequestState = { status: "unknown", reason: "GitHub CLI unavailable or read failed" };
  }
}
const remoteHeadSha = requestedRemoteHead ?? (pullRequestState.status === "observed" ? pullRequestState.headRefOid : null);
const remoteHeadMatchesLocal = remoteHeadSha ? remoteHeadSha === startHead : null;
const allowedPatchRoot = resolve(workspaceRoot, "plans/patches");
let patch = { status: "not-supplied" };
if (requestedPatch) {
  const patchPath = resolve(requestedPatch);
  if (!patchPath.startsWith(`${allowedPatchRoot}${sep}`)) {
    throw new Error("patch file is outside the allowlisted plans/patches directory");
  }
  if (!existsSync(patchPath)) throw new Error("patch file does not exist");
  const artifactPatchId = patchId(await readFile(patchPath, "utf8"));
  const worktreePatchId = patchId(git(["diff", "--binary", "upstream/main...HEAD"]));
  patch = {
    status: artifactPatchId && worktreePatchId ? "compared" : "uncomparable",
    path: relative(workspaceRoot, patchPath),
    artifactPatchId,
    worktreePatchId,
    matchesWorktreeDelta: artifactPatchId === worktreePatchId,
  };
}
const endHead = git(["rev-parse", "HEAD"]);
const relatedRunIds = (item[0].relatedRefs || []).filter((ref) => /(?:run|actions\/runs)[/:]?[0-9]+/i.test(ref));
console.log(JSON.stringify({
  status: startHead === endHead ? "current" : "stale",
  capturedAt: new Date().toISOString(),
  workRegisterId,
  branch: git(["branch", "--show-current"]),
  headSha: startHead,
  upstreamRelation: git(["rev-list", "--left-right", "--count", "upstream/main...HEAD"]),
  dirty,
  identity: {
    name: optional("git", ["config", "user.name"]) || "unknown",
    emailPresent: Boolean(optional("git", ["config", "user.email"])),
  },
  remotes: git(["remote", "-v"]).split("\n").filter((line) => /^(origin|upstream)\s/.test(line)),
  pullRequest: pullRequestState,
  remoteHeadSha,
  remoteHeadSource: requestedRemoteHead ? "supplied" : pullRequestState.status === "observed" ? "github-cli" : "unknown",
  remoteHeadMatchesLocal,
  patch,
  cleanRunnerRunIds: relatedRunIds.filter((ref) => ref.includes(startHead)),
  worktree: relative(workspaceRoot, worktree),
  references: { issues: item[0].issues, pullRequests: item[0].pullRequests },
}, null, 2));