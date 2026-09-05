#!/usr/bin/env node

import { readFile } from "node:fs/promises";

export function classifyReviewThreads(threads) {
  if (!Array.isArray(threads)) throw new Error("review threads must be an array");
  return threads.map((thread) => {
    if (thread.duplicateOf) return { id: thread.id, classification: "duplicate", relatedTo: thread.duplicateOf };
    if (thread.status && thread.status !== "open") return { id: thread.id, classification: "stale" };
    if (thread.needsMaintainerDecision === true) return { id: thread.id, classification: "maintainer-decision-needed" };
    return { id: thread.id, classification: "valid" };
  });
}

async function main() {
  const [inputPath, headSha] = process.argv.slice(2);
  if (!inputPath || !headSha) throw new Error("usage: review-follow-up-contract.mjs <threads.json> <head-sha>");
  const threads = JSON.parse(await readFile(inputPath, "utf8"));
  console.log(JSON.stringify({ status: "advisory", headSha, threads: classifyReviewThreads(threads), writesAuthorized: false }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});