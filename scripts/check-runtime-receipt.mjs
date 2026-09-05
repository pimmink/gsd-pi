#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const [receiptPath, worktreePath] = process.argv.slice(2);
if (!receiptPath || !worktreePath) throw new Error("usage: check-runtime-receipt.mjs <receipt.json> <worktree>");

const receipt = JSON.parse(await readFile(resolve(receiptPath), "utf8"));
const worktree = resolve(worktreePath);
const observedSha = execFileSync("git", ["-C", worktree, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const validLayers = new Set(["source", "built-cli", "vsix", "project-extension", "managed-runtime"]);
const artifactPath = receipt.artifactPath ? resolve(worktree, receipt.artifactPath) : null;
const findings = [];
if (!/^[0-9a-f]{40}$/.test(receipt.sourceSha || "")) findings.push("receipt sourceSha must be a full lowercase SHA");
if (receipt.sourceSha && receipt.sourceSha !== observedSha) findings.push(`receipt SHA ${receipt.sourceSha} does not match current HEAD ${observedSha}`);
if (!validLayers.has(receipt.activationLayer)) findings.push("receipt activationLayer is unknown");
if (artifactPath && !await import("node:fs/promises").then(({ access }) => access(artifactPath).then(() => true).catch(() => false))) findings.push(`artifact does not exist: ${receipt.artifactPath}`);
if (!receipt.probe || receipt.probe.status !== "pass") findings.push("fresh-process probe is not recorded as pass");
console.log(JSON.stringify({ status: findings.length ? "stale-or-incomplete" : "current", observedSha, activationLayer: receipt.activationLayer ?? "unknown", artifactPath: receipt.artifactPath ?? null, findings }, null, 2));
process.exitCode = findings.length ? 1 : 0;