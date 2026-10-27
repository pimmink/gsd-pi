import assert from "node:assert/strict";
import { test } from "node:test";
import { runInThisContext } from "node:vm";
import { describeCoordinationMaintenanceFailure } from "../coordination-maintenance-diagnostics.js";

test("diagnostic classifies SQLite failures without exposing messages, SQL, paths or causes", () => {
  const secret = "private-diagnostic-sentinel";
  const error = Object.assign(new Error(`FOREIGN KEY constraint failed: ${secret}`), {
    code: "SQLITE_CONSTRAINT_FOREIGNKEY", sql: secret, params: [secret], cause: secret,
  });
  const reply = describeCoordinationMaintenanceFailure(error, "apply");
  assert.equal(reply.phase, "apply");
  assert.equal(reply.kind, "sqlite-foreign-key");
  assert.equal(reply.code, "SQLITE_CONSTRAINT_FOREIGNKEY");
  assert.equal(JSON.stringify(reply).includes(secret), false);
});

test("diagnostic emits only static owned module labels and bounded source locations", () => {
  const error = { message: "private-message", stack: [
    "Error: private-message",
    "    at privateFunction (/private/customer/extensions/gsd/db/domain-operation.ts:1143:9)",
    "    at leak (/private/customer-assets/secret.ts:123:4)",
    "    at leak (/private/customer/extensions/gsd/customer-secret.ts:123:4)",
    "    at fail (/private/customer/extensions/gsd/db/engine.js:3197:7)",
  ].join("\n") };
  const reply = describeCoordinationMaintenanceFailure(error, "apply");
  assert.deepEqual(reply.frames, [
    { module: "db/domain-operation", line: 1143, column: 9 },
    { module: "db/engine", line: 3197, column: 7 },
  ]);
  assert.equal(JSON.stringify(reply).includes("private"), false);
});

test("diagnostic supports native Error.stack accessors on Node 24 without accepting custom accessors", () => {
  const error = runInThisContext("new Error('private-native-stack-message')", { filename: "/fixture/extensions/gsd/db/engine.ts" });
  const reply = describeCoordinationMaintenanceFailure(error, "receipt");
  assert(reply.frames.some(frame => frame.module === "db/engine"));
  assert.equal(JSON.stringify(reply).includes("private-native-stack-message"), false);
});

test("diagnostic never invokes arbitrary exception getters", () => {
  let accessed = 0;
  const error = {};
  for (const key of ["message", "code", "stack", "cause"]) {
    Object.defineProperty(error, key, { get() { accessed++; throw new Error("must not run"); } });
  }
  assert.deepEqual(describeCoordinationMaintenanceFailure(error, "prepare"), { phase: "prepare", kind: "unclassified", frames: [] });
  assert.equal(accessed, 0);
});

test("diagnostic rejects unknown codes and tolerates non-Error throws and hostile descriptors", () => {
  for (const error of [null, undefined, "private-value", 12, { code: "SECRET_CUSTOMER_VALUE" }, new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("private-value"); } })]) {
    assert.deepEqual(describeCoordinationMaintenanceFailure(error, "host-check"), { phase: "host-check", kind: "unclassified", frames: [] });
  }
});

test("diagnostic bounds frame count and rejects invalid source coordinates", () => {
  const error = { stack: "Error\n" + Array.from({ length: 10 }, () => "    at fail (/fixture/extensions/gsd/db/engine.ts:1:2)").join("\n") };
  assert.equal(describeCoordinationMaintenanceFailure(error, "apply").frames.length, 4);
  error.stack = "Error\n    at fail (/fixture/extensions/gsd/db/engine.ts:0:2)\n    at fail (/fixture/extensions/gsd/db/engine.ts:12345678:2)";
  assert.deepEqual(describeCoordinationMaintenanceFailure(error, "apply").frames, []);
});
