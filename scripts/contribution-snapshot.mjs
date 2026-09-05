#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const [workRegisterId, requestedWorktree, requestedPullRequest] = process.argv.slice(2);
if (!workRegisterId || !requestedWorktree) {
  throw new Error("usage: contribution-snapshot.mjs <GSD-W###> <feature-worktree> [pull-request]");
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
  cleanRunnerRunIds: relatedRunIds.filter((ref) => ref.includes(startHead)),
  worktree: relative(workspaceRoot, worktree),
  references: { issues: item[0].issues, pullRequests: item[0].pullRequests },
}, null, 2));