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

// Match job-level fields only: a step's if/needs/runner must not satisfy a
// missing job boundary. Keep this source-only guard dependency-free, as below.
function jobBody(source: string, job: string): string {
	const body = source.match(
		new RegExp(
			`^  ${job}:\\n([\\s\\S]*?)(?=^  [a-zA-Z0-9_-]+:|$(?![\\s\\S]))`,
			"m",
		),
	)?.[1];
	assert.ok(body, `${job} job must exist`);
	return body;
}

const linuxFallback =
	"${{ github.repository_owner == 'pimmink' && 'ubuntu-latest' || 'blacksmith-4vcpu-ubuntu-2404' }}";
const buildRunner =
	"${{ github.repository == 'pimmink/gsd-pi' && 'ubuntu-24.04' || github.repository_owner == 'pimmink' && 'ubuntu-latest' || 'blacksmith-4vcpu-ubuntu-2404' }}";
const windowsFallback =
	"${{ github.repository_owner == 'pimmink' && 'windows-latest' || 'blacksmith-4vcpu-windows-2025' }}";
const legacyLinuxJobs = [
	"fast-gates",
	"build",
	"node22-smoke",
	"workflow-lint",
];

function assertJobField(
	source: string,
	job: string,
	field: string,
	expected: string,
): void {
	const values = [
		...jobBody(source, job).matchAll(new RegExp(`^    ${field}: (.*)$`, "gm")),
	];
	assert.equal(
		values.length,
		1,
		`${job}.${field} must occur exactly once at job level`,
	);
	assert.equal(values[0][1], expected, `${job}.${field} policy`);
}

function assertRunnerPolicy(source: string): void {
	// Preserve the original global guard as well as named-job contracts.
	assert.doesNotMatch(source, /runs-on:\s*blacksmith-/);
	for (const job of legacyLinuxJobs) {
		assertJobField(
			source,
			job,
			"runs-on",
			job === "build" ? buildRunner : linuxFallback,
		);
	}
	assertJobField(source, "windows-portability", "runs-on", windowsFallback);
	assertJobField(
		source,
		"fork-unit",
		"if",
		"github.repository == 'pimmink/gsd-pi'",
	);
	assertJobField(source, "fork-unit", "needs", "build");
	assertJobField(source, "fork-unit", "runs-on", "ubuntu-24.04");
}

function replaceJobField(
	source: string,
	job: string,
	field: string,
	value: string | null,
): string {
	const body = jobBody(source, job);
	const changed = body.replace(
		new RegExp(`^    ${field}: .*\\n`, "m"),
		value === null ? "" : `    ${field}: ${value}\n`,
	);
	assert.notEqual(changed, body, `fixture must mutate ${job}.${field}`);
	return source.replace(body, changed);
}

test("job-specific runner policy preserves fork pins and upstream Blacksmith fallbacks", () => {
	assertRunnerPolicy(workflow);
});

test("runner policy rejects removed or widened legacy Linux and Windows boundaries", () => {
	assert.throws(
		() =>
			assertRunnerPolicy(
				`${workflow}\n  unexpected-pool:\n    runs-on: blacksmith-4vcpu-ubuntu-2404\n`,
			),
		assert.AssertionError,
	);
	for (const job of [...legacyLinuxJobs, "windows-portability"]) {
		const expected =
			job === "build"
				? buildRunner
				: job === "windows-portability"
					? windowsFallback
					: linuxFallback;
		for (const value of [
			null,
			"ubuntu-latest",
			expected.replace("'pimmink'", "'other-owner'"),
		]) {
			assert.throws(
				() =>
					assertRunnerPolicy(replaceJobField(workflow, job, "runs-on", value)),
				assert.AssertionError,
			);
		}
	}
});

test("runner policy rejects build special-case drift and mismatched native consumers", () => {
	for (const value of [
		linuxFallback,
		buildRunner.replace("pimmink/gsd-pi", "pimmink/other"),
		buildRunner.replace("'ubuntu-24.04'", "'ubuntu-latest'"),
		buildRunner.replace("'ubuntu-latest'", "'ubuntu-24.04'"),
		buildRunner.replace("'blacksmith-4vcpu-ubuntu-2404'", "'ubuntu-latest'"),
	]) {
		assert.throws(
			() =>
				assertRunnerPolicy(
					replaceJobField(workflow, "build", "runs-on", value),
				),
			assert.AssertionError,
		);
	}
	for (const [field, wrongValue] of [
		["if", "github.repository_owner == 'pimmink'"],
		["if", "github.repository == 'pimmink/other'"],
		["if", "true"],
		["needs", "fast-gates"],
		["runs-on", "ubuntu-latest"],
	]) {
		for (const value of [null, wrongValue]) {
			assert.throws(
				() =>
					assertRunnerPolicy(
						replaceJobField(workflow, "fork-unit", field, value),
					),
				assert.AssertionError,
			);
		}
	}
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
