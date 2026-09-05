#!/usr/bin/env node

import { execFileSync } from "node:child_process";

export function findContractChanges(diff) {
  const text = String(diff);
  const addedApiNames = [...text.matchAll(/^\+.*\b((?:register|get|set)[A-Z]\w*)\s*(?:\(|:)/gm)].map((match) => match[1]);
  const rpcLiterals = [...text.matchAll(/^\+.*\b(?:command|method|type)\s*:\s*["']([a-z][a-z0-9_-]*)["']/gmi)].map((match) => match[1]);
  const constructorChanges = [...text.matchAll(/^\+.*\bconstructor\s*\(/gm)].map((match) => match[0].trim());
  const mockFactoryChanges = [...text.matchAll(/^\+.*\b(?:create|make|build)\w*(?:mock|fixture)\s*\(/gmi)].map((match) => match[0].trim());
  const objectLiteralCallSites = [...text.matchAll(/^\+.*\b(?:mock|fixture)\w*\s*=\s*\{/gmi)].map((match) => match[0].trim());
  return {
    addedApiNames: [...new Set(addedApiNames)],
    rpcLiterals: [...new Set(rpcLiterals)],
    constructorChanges,
    mockFactoryChanges,
    objectLiteralCallSites,
  };
}

function main() {
  const base = process.argv[2] ?? "upstream/main";
  const diff = execFileSync("git", ["diff", "--unified=0", `${base}...HEAD`], { encoding: "utf8" });
  const changes = findContractChanges(diff);
  const names = [...changes.addedApiNames, ...changes.rpcLiterals];
  const candidates = [...new Set(names)].map((name) => ({
    name,
    command: `rg -n "${name}" --glob '*test*' --glob '*.ts'`,
  }));
  console.log(JSON.stringify({ base, status: "advisory", ...changes, candidates }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main();