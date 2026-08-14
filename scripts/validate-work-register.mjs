#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const registerPath = resolve(process.cwd(), "docs/work-register.json");
const projectionPath = resolve(process.cwd(), "docs/work-register.md");
const register = JSON.parse(await readFile(registerPath, "utf8"));
const projection = await readFile(projectionPath, "utf8");
const allowedStatuses = new Set(register.statusVocabulary);
const allowedScopes = new Set(["upstream", "fork-local"]);
const allowedDispositions = new Set([
	"pr-required",
	"no-pr-planned",
	"historical",
]);
const ids = new Set();

assert.equal(
	register.schemaVersion,
	1,
	"unsupported work-register schemaVersion",
);
assert.match(
	register.evidenceAsOf,
	/^\d{4}-\d{2}-\d{2}$/,
	"evidenceAsOf must be YYYY-MM-DD",
);
assert.ok(
	Array.isArray(register.items) && register.items.length > 0,
	"work register must contain items",
);

for (const item of register.items) {
	assert.match(item.id, /^GSD-W\d{3}$/, `invalid work id: ${item.id}`);
	assert.ok(!ids.has(item.id), `duplicate work id: ${item.id}`);
	ids.add(item.id);
	assert.ok(
		projection.includes(item.id),
		`${item.id}: missing from Markdown projection`,
	);
	assert.ok(
		allowedStatuses.has(item.status),
		`${item.id}: unsupported status ${item.status}`,
	);
	assert.ok(
		allowedScopes.has(item.scope),
		`${item.id}: unsupported scope ${item.scope}`,
	);
	assert.ok(
		allowedDispositions.has(item.upstreamDisposition),
		`${item.id}: unsupported upstream disposition ${item.upstreamDisposition}`,
	);
	if (item.scope === "fork-local") {
		assert.equal(
			item.upstreamDisposition,
			"no-pr-planned",
			`${item.id}: fork-local work must not require an upstream PR`,
		);
	}

	for (const field of ["issues", "pullRequests", "branches", "commits"]) {
		assert.ok(
			Array.isArray(item[field]),
			`${item.id}: ${field} must be an array`,
		);
		assert.equal(
			new Set(item[field]).size,
			item[field].length,
			`${item.id}: duplicate ${field} reference`,
		);
	}

	for (const field of ["title", "context", "validation", "nextAction"]) {
		assert.ok(
			typeof item[field] === "string" && item[field].trim(),
			`${item.id}: ${field} is required`,
		);
	}

	for (const commit of item.commits) {
		assert.match(
			commit,
			/^[0-9a-f]{7,40}$/,
			`${item.id}: invalid commit ${commit}`,
		);
	}
}

console.log(
	`work register valid: ${register.items.length} items, evidence ${register.evidenceAsOf}`,
);
