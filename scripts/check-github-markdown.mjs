#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const SUPPORTED_DIAGRAMS = new Set(["flowchart", "sequenceDiagram", "stateDiagram-v2"]);

export function checkGitHubMarkdown(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const findings = [];
  let blockStart = null;
  let body = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (blockStart === null && /^```mermaid\s*$/.test(line)) {
      blockStart = index;
      body = [];
      continue;
    }
    if (blockStart !== null && /^```\s*$/.test(line)) {
      const first = body.find((entry) => entry.trim());
      const lineNumber = blockStart + 1;
      if (!first) findings.push({ level: "error", line: lineNumber, message: "empty Mermaid block" });
      else if (!SUPPORTED_DIAGRAMS.has(first.trim().split(/\s+/)[0])) {
        findings.push({ level: "error", line: lineNumber, message: "unsupported Mermaid diagram type" });
      }
      const identifiers = new Set();
      for (const [offset, content] of body.entries()) {
        const nodeMatch = content.match(/^\s*([^\s\[]+)\s*\[([^\]]*)\]/);
        if (nodeMatch && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(nodeMatch[1])) {
          findings.push({ level: "error", line: blockStart + offset + 2, message: `unsafe Mermaid identifier: ${nodeMatch[1]}` });
        }
        if (nodeMatch && /[,()#*:[\]]/.test(nodeMatch[2]) && !/^\s*["'].*["']\s*$/.test(nodeMatch[2])) {
          findings.push({ level: "error", line: blockStart + offset + 2, message: "Mermaid labels with punctuation must be quoted" });
        }
        const match = content.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\[/);
        if (match) {
          if (identifiers.has(match[1])) findings.push({ level: "error", line: blockStart + offset + 2, message: `duplicate Mermaid identifier: ${match[1]}` });
          identifiers.add(match[1]);
        }
        if (/subgraph\s+#|\[.*https?:\/\/|<[^>]+>/.test(content)) {
          findings.push({ level: "warning", line: blockStart + offset + 2, message: "Mermaid content may not render on GitHub" });
        }
      }
      const preceding = lines.slice(Math.max(0, blockStart - 3), blockStart).join("\n").trim();
      if (!preceding) findings.push({ level: "warning", line: lineNumber, message: "diagram has no adjacent prose summary" });
      blockStart = null;
      continue;
    }
    if (blockStart !== null) body.push(line);
  }
  if (blockStart !== null) findings.push({ level: "error", line: blockStart + 1, message: "unclosed Mermaid block" });
  return findings;
}

async function main() {
  const path = process.argv[2];
  const markdown = path ? await readFile(path, "utf8") : await new Promise((resolve, reject) => {
    let text = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { text += chunk; });
    process.stdin.on("end", () => resolve(text));
    process.stdin.on("error", reject);
  });
  const findings = checkGitHubMarkdown(markdown);
  console.log(JSON.stringify({ status: findings.some((finding) => finding.level === "error") ? "invalid" : "valid", findings }, null, 2));
  if (findings.some((finding) => finding.level === "error")) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});