// Planning/publication artifact checks only; not product, provider or host acceptance.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../../", import.meta.url));
const baseline = "ee286ce386f79acc240e7fbbe10ece892cedc534";
const aliases = ["U", "C01", "C02", "C03", "C04", "C05", "C06", "C07"];
const rendered = process.argv[2];
const packet = createHash("sha256");
const sources = new Map();
let anchorCount = 0;
let placeholderCount = 0;

for (const alias of aliases) {
  const text = readFileSync(join(rendered ?? folder, `${alias}.md`), "utf8");
  assert.equal([...text.matchAll(/^# /gm)].length, 1, `${alias}: one H1`);
  assert.ok(text.length < 65000, `${alias}: GitHub body budget`);
  assert.match(text, /> \[!(?:IMPORTANT|NOTE|WARNING)\]/, `${alias}: status alert`);
  assert.match(text, /^\|.+\|\n\|[ :|-]+\|/m, `${alias}: real GFM table`);
  assert.match(text, /^- \[[ x]\]/m, `${alias}: acceptance task list`);
  assert.ok(text.includes(baseline), `${alias}: pinned source subject`);
  assert.ok(
    text.indexOf("Optimized for agent pickup") >= 0 &&
      text.indexOf("Optimized for agent pickup") < 400,
    `${alias}: agent-optimized banner must be at the top`,
  );
  assert.doesNotMatch(
    text,
    /\/Users\/|edelmanstud\.io|883999922121|AKIA[A-Z0-9]{16}/,
    `${alias}: public-safe body`,
  );
  if (alias !== "U") {
    assert.match(
      text,
      /\{\{U\}\}|https:\/\/github\.com\/open-gsd\/gsd-pi\/issues\/\d+/,
      `${alias}: parent`,
    );
    assert.match(
      text,
      /not run|future|not executed|not execute/i,
      `${alias}: no invented execution proof`,
    );
    assert.match(text, /BLOCKED|gated|conditional/i, `${alias}: readiness boundary`);
  }
  for (const match of text.matchAll(/\{\{([^{}]+)\}\}/g)) {
    assert.ok(
      !rendered && aliases.includes(match[1]),
      `${alias}: unresolved/unknown link ${match[0]}`,
    );
    placeholderCount++;
  }
  let fenceOpen = false;
  for (const line of text.split("\n")) {
    if (!line.startsWith("```")) continue;
    if (!fenceOpen) assert.match(line, /^```[A-Za-z][\w-]*\s*$/, `${alias}: fenced language`);
    else assert.match(line, /^```\s*$/, `${alias}: closing fence`);
    fenceOpen = !fenceOpen;
  }
  assert.equal(fenceOpen, false, `${alias}: balanced fences`);
  for (const match of text.matchAll(
    /https:\/\/github\.com\/open-gsd\/gsd-pi\/blob\/([a-f0-9]{40})\/([^\s)]+?)(?=[)\s])/g,
  )) {
    const sha = match[1];
    assert.equal(sha, baseline, `${alias}: source link revision`);
    const [path, fragment = ""] = match[2].split("#");
    if (!sources.has(path)) {
      sources.set(
        path,
        execFileSync("git", ["show", `${sha}:${path}`], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 5_000_000,
        }),
      );
    }
    const range = fragment.match(/^L(\d+)(?:-L(\d+))?$/);
    if (fragment) assert.ok(range, `${alias}: explicit source line fragment`);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2] ?? range[1]);
      assert.ok(
        start >= 1 && end >= start && end <= sources.get(path).split("\n").length,
        `${alias}: valid source lines ${path}#${fragment}`,
      );
    }
    anchorCount++;
  }
  packet.update(alias).update("\0").update(text).update("\0");
}
const read = (alias) => readFileSync(join(rendered ?? folder, `${alias}.md`), "utf8");
assert.match(read("C01"), /four[- ]surface|four graph/i);
assert.match(read("C01"), /gsd_memory_graph/);
assert.match(read("C02"), /C03-A/);
assert.match(read("C03"), /Phase A/);
assert.match(read("C03"), /Phase B/);
assert.match(read("C04"), /1\.29\.0/);
assert.match(read("C04"), /McpToolExtra\.signal/);
assert.match(read("C05"), /C07-B phase-one pilot evidence checkpoint/);
assert.match(read("C05"), /post-pilot demand decision/);
assert.match(read("C05"), /not closure of the whole C07 issue/);
assert.match(read("C07"), /base-route phase-one pilot evidence checkpoint/);
assert.match(read("U"), /not.*(?:implementation approval|implementation-ready)/i);
assert.match(read("U"), /already ships.*\/gsd graphify/);
assert.match(read("U"), /not a proposal to add Graphify to GSD from scratch/);
assert.ok(anchorCount >= 50, "source-grounded packet, not broad generic prose");
console.log(
  JSON.stringify(
    {
      result: "PASS",
      kind: rendered ? "rendered-publication" : "draft-contract",
      issues: aliases.length,
      sourceFiles: sources.size,
      sourceAnchors: anchorCount,
      allowedDraftPlaceholders: placeholderCount,
      packetSha256: packet.digest("hex"),
      baseline,
      limitation:
        "Checks shape, source paths/ranges and selected invariants; not model compliance, provider correctness, semantic line attribution or real-host execution.",
    },
    null,
    2,
  ),
);
