// Publication text renderer only. It never calls GitHub or treats issue bodies as commands.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const folder = fileURLToPath(new URL(".", import.meta.url));
export const aliases = ["U", "C01", "C02", "C03", "C04", "C05", "C06", "C07"];

export function renderText(text, links, allowPending = false) {
  return text.replace(/\{\{([^{}]+)\}\}/g, (_match, alias, offset) => {
    assert.ok(aliases.includes(alias), `Unknown alias: ${alias}`);
    const target = links[alias]?.url;
    const linkTarget = /\]\(\s*$/.test(text.slice(0, offset));
    if (target) {
      assert.match(target, /^https:\/\/github\.com\/open-gsd\/gsd-pi\/issues\/[1-9]\d*$/);
      assert.equal(Number(target.split("/").at(-1)), Number(links[alias].number));
      return linkTarget ? target : `[#${links[alias].number}](${target})`;
    }
    assert.ok(allowPending && alias !== "U", `Missing published link: ${alias}`);
    const parent = links.U?.url;
    if (linkTarget) {
      assert.ok(parent, "A provisional sibling link needs an existing parent");
      return `${parent}#agent-pickup-and-work-packages`;
    }
    return parent
      ? `[${alias} — publication pending](${parent}#agent-pickup-and-work-packages)`
      : `${alias} — child link pending publication`;
  });
}

export function renderIssue(alias, links, allowPending = false) {
  assert.ok(aliases.includes(alias));
  const text = readFileSync(join(folder, `${alias}.md`), "utf8");
  const body = renderText(text, links, allowPending);
  assert.doesNotMatch(body, /\{\{[^{}]+\}\}/);
  return body;
}

function saveOwned(path, content) {
  // Existing files are generated artifacts owned by this renderer; read before replacement.
  if (existsSync(path) && readFileSync(path, "utf8") === content) return;
  writeFileSync(path, content);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--self-test") {
    const links = Object.fromEntries(
      aliases.map((alias, i) => [
        alias,
        { number: i + 1, url: `https://github.com/open-gsd/gsd-pi/issues/${i + 1}` },
      ]),
    );
    assert.equal(
      renderText("Parent {{U}}; [C01]({{C01}})", links),
      "Parent [#1](https://github.com/open-gsd/gsd-pi/issues/1); [C01](https://github.com/open-gsd/gsd-pi/issues/2)",
    );
    assert.throws(() => renderText("{{C01}}", {}), /Missing/);
    assert.throws(
      () => renderText("{{U}}", { U: { number: 1, url: "https://example.invalid/issues/1" } }),
      /input did not match/,
    );
    assert.throws(() => renderText("{{UNKNOWN}}", links), /Unknown/);
    assert.match(renderText("[C01]({{C01}})", { U: links.U }, true), /issues\/1#agent-pickup/);
    assert.doesNotMatch(renderText("{{C01}}", {}, true), /\{\{/);
    console.log(
      "PASS: six renderer checks; nested Markdown links, missing links, repository binding and provisional references handled without GitHub writes.",
    );
  } else {
    assert.ok(process.argv[2], "Usage: node render.mjs LINKS_JSON [--pending]");
    const links = JSON.parse(readFileSync(process.argv[2], "utf8"));
    const pending = process.argv[3] === "--pending";
    const output = join(folder, pending ? "publication-drafts" : "rendered");
    mkdirSync(output, { recursive: true });
    for (const alias of aliases) {
      if (pending && !links.U && alias !== "U") continue;
      saveOwned(join(output, `${alias}.md`), renderIssue(alias, links, pending));
    }
    console.log(
      `${pending ? "Provisional" : "Final"} bodies written to ${output}; no GitHub writes.`,
    );
  }
}
