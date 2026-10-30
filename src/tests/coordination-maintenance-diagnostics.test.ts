import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { maintenanceFailureDetails } from "../resources/shared/coordination-maintenance-diagnostics.js";

const owned = new URL("../resources/extensions/gsd/db/engine.ts", import.meta.url);
const backend = new URL("../coordination-maintenance-backend.js", import.meta.url);

test("failure metadata contains only phase, fixed kind, allowlisted code and bounded owned coordinates", () => {
  const error = Object.assign(new Error("/private/project token=private-token argv env"), { code: "SQLITE_BUSY", cause: "private-cause" });
  error.stack = `Error: /private/project
    at privateFunction (${owned.href}:123:7)
    at ${fileURLToPath(backend)}:80:4
    at /foreign/engine.ts:1:2
    at /foreign${fileURLToPath(owned)}:8:9
    at ${owned.href}:1000001:1
    at ${owned.href}:0:2
    at ${owned.href}:9:3
    at ${owned.href}:10:3`;
  assert.deepEqual(maintenanceFailureDetails("apply", error), {
    phase: "apply", kind: "native-maintenance-failure", code: "SQLITE_BUSY",
    sources: [
      { module: "extensions/gsd/db/engine.ts", line: 123, column: 7 },
      { module: "coordination-maintenance-backend.js", line: 80, column: 4 },
      { module: "extensions/gsd/db/engine.ts", line: 9, column: 3 },
    ],
  });
  assert.doesNotMatch(JSON.stringify(maintenanceFailureDetails("apply", error)), /private|foreign|argv|env|token|cause/);
});

test("unknown codes, non-Errors, hostile accessors, causes and overlong stacks cannot leak", () => {
  let accessed = 0;
  const error = new Error("private-message");
  Object.defineProperties(error, {
    code: { get() { accessed++; throw new Error("private-getter"); } },
    stack: { get() { accessed++; throw new Error("private-stack"); } },
  });
  assert.deepEqual(maintenanceFailureDetails("open", error), { phase: "open", kind: "native-maintenance-failure", sources: [] });
  assert.equal(accessed, 0);
  for (const value of ["private-value", null, { code: "SQLITE_BUSY", stack: "private-stack" }, new Proxy({}, { get() { throw new Error("private-proxy"); } })]) {
    assert.deepEqual(maintenanceFailureDetails("input", value), { phase: "input", kind: "native-maintenance-failure", sources: [] });
  }
  const huge = Object.assign(new Error("private"), { code: "private-code" });
  huge.stack = `Error: private
${"x".repeat(20_000)}
    at ${owned.href}:1:2`;
  assert.deepEqual(maintenanceFailureDetails("receipt", huge), { phase: "receipt", kind: "native-maintenance-failure", sources: [] });
});

test("real intrinsic Error stacks are accepted without exporting messages or absolute paths", () => {
  const error = new Error("private-error");
  const details = maintenanceFailureDetails("close", error);
  assert.equal(details.phase, "close");
  assert.equal(details.kind, "native-maintenance-failure");
  assert.doesNotMatch(JSON.stringify(details), /private-error|file:|Users|node_modules/);
});
