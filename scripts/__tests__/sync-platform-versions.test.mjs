// Project/App: gsd-pi
// File Purpose: Regression coverage for native platform dependency version sync.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveEngineOptionalDependencyVersion } = require("../lib/version-sync.cjs");

test("sync-platform-versions keeps dev optionalDependencies on stable engine semver", () => {
  const script = readFileSync("native/scripts/sync-platform-versions.cjs", "utf8");

  assert.match(script, /resolveEngineOptionalDependencyVersion/);
  assert.match(script, /optionalDependencyVersion/);
});

test("verify-native-platform-packages checks pinned optionalDependency versions", () => {
  const script = readFileSync("scripts/verify-native-platform-packages.mjs", "utf8");

  assert.match(script, /optionalDependencies\[name\]/);
  assert.doesNotMatch(script, /\$\{name\}@\$\{version\}/);
});

test("prepublish verifies matching native platform packages before publishing main package", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));

  assert.match(pkg.scripts.prepublishOnly, /verify:native-platform-packages/);
  assert.ok(
    pkg.scripts.prepublishOnly.indexOf("verify:native-platform-packages") <
      pkg.scripts.prepublishOnly.indexOf("validate-pack"),
  );
});

test("root package pins native optional dependencies to the canonical engine release version", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const nativeDeps = Object.entries(pkg.optionalDependencies).filter(([name]) =>
    name.startsWith("@opengsd/engine-"),
  );

  assert.equal(nativeDeps.length, 5);
  for (const [name, spec] of nativeDeps) {
    assert.equal(spec, resolveEngineOptionalDependencyVersion(pkg.version), `${name} must match the canonical engine release version`);
  }
});
