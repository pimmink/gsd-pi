import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Source tests run under src/tests, while compiled tests run under dist-test/src/tests;
// walk ancestors so this guard validates the repository workflow in both layouts.
function findWorkflowPath(): string {
	let directory = dirname(fileURLToPath(import.meta.url));
	while (true) {
		const candidate = resolve(directory, ".github/workflows/ci.yml");
		if (existsSync(candidate)) return candidate;
		const parent = dirname(directory);
		if (parent === directory) break;
		directory = parent;
	}
	throw new Error(
		"Unable to locate .github/workflows/ci.yml from the test file",
	);
}

const workflow = readFileSync(findWorkflowPath(), "utf8");

test("only pimmink uses hosted runners instead of the upstream Blacksmith pool", () => {
	const linuxRunner =
		"runs-on: ${{ github.repository_owner == 'pimmink' && 'ubuntu-latest' || 'blacksmith-4vcpu-ubuntu-2404' }}";
	const windowsRunner =
		"runs-on: ${{ github.repository_owner == 'pimmink' && 'windows-latest' || 'blacksmith-4vcpu-windows-2025' }}";
	assert.equal(workflow.split(linuxRunner).length - 1, 4);
	assert.equal(workflow.split(windowsRunner).length - 1, 1);
	assert.doesNotMatch(workflow, /runs-on:\s*blacksmith-/);
});

function windowsPackageTestStep(): string {
	const job = workflow.match(
		/ {2}windows-portability:\n(?<body>[\s\S]*?)(?=\n {2}[a-zA-Z0-9_-]+:|\n?$)/,
	)?.groups?.body;
	assert.ok(job, "windows-portability job must exist");
	assert.ok(
		job.includes(
			"runs-on: ${{ github.repository_owner == 'pimmink' && 'windows-latest' || 'blacksmith-4vcpu-windows-2025' }}",
		),
	);

	const step = job.match(
		/ {6}- name: Run package tests\n(?<body>[\s\S]*?)(?=\n {6}- name:|\n?$)/,
	)?.groups?.body;
	assert.ok(step, "Windows Run package tests step must exist");
	return step;
}

test("Windows package tests keep temp overrides step-local", () => {
	const step = windowsPackageTestStep();

	for (const variable of ["TEMP", "TMP", "TMPDIR"]) {
		assert.match(
			step,
			new RegExp(`^\\s+${variable}: \\$\\{\\{ runner\\.temp \\}\\}$`, "m"),
			`${variable} must point to runner.temp in the Windows package-test step`,
		);
	}

	assert.match(step, /GSD_NATIVE_PREFER_LOCAL: '1'/);
	assert.match(step, /run: pnpm run test:packages/);
	assert.doesNotMatch(
		workflow,
		/^env:\n(?: {2}.*\n)* {2}(?:TEMP|TMP|TMPDIR): \$\{\{ runner\.temp \}\}/m,
		"temp overrides must not become a cross-job or cross-OS environment",
	);
});
