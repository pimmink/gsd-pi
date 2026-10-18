import assert from "node:assert/strict";
import test from "node:test";
import { clampThinkingLevel, getModel, getSupportedThinkingLevels } from "../../../../../packages/pi-ai/src/models.js";
import { streamSimpleAnthropic } from "../../../../../packages/pi-ai/src/providers/anthropic.js";
import { streamSimpleOpenAICompletions } from "../../../../../packages/pi-ai/src/providers/openai-completions.js";
import { streamOpenAIResponses, streamSimpleOpenAIResponses } from "../../../../../packages/pi-ai/src/providers/openai-responses.js";
import type { Api, Context, Model, SimpleStreamOptions, StreamFunction } from "../../../../../packages/pi-ai/src/types.js";
import { sanitizeGitHubCopilotModels } from "../copilot-model-catalog.js";
import { synthesizeCopilotOverlayEntry } from "../copilot-overlay-writer.js";

const context: Context = {
  systemPrompt: "Diagnostic",
  messages: [{ role: "user", content: "Diagnostic", timestamp: 0 }],
};

function assertModelApi<T extends Api>(model: Model<Api>, api: T): asserts model is Model<T> {
  assert.equal(model.api, api);
}

async function capture<T extends Api>(
  stream: StreamFunction<T, SimpleStreamOptions>,
  model: Model<T>,
  reasoning?: SimpleStreamOptions["reasoning"],
): Promise<Record<string, unknown>> {
  let payload: Record<string, unknown> | undefined;
  const result = await stream(model, context, {
    apiKey: "diagnostic-placeholder",
    reasoning,
    onPayload(value) {
      assert.ok(value && typeof value === "object" && !Array.isArray(value));
      payload = structuredClone(value) as Record<string, unknown>;
      throw new Error("DIAGNOSTIC_PAYLOAD_CAPTURE");
    },
  }).result();
  assert.ok(payload, result.errorMessage);
  assert.match(result.errorMessage ?? "", /DIAGNOSTIC_PAYLOAD_CAPTURE/);
  return payload;
}

function record(id: string, overrides: Record<string, unknown> = {}) {
  const [value] = sanitizeGitHubCopilotModels({ data: [{
    id, name: id, tool_call: true, supported_endpoints: ["/responses"],
    vision: false, reasoning: true, limit: { context: 400000, output: 128000 },
    cost: { input: 0.2, output: 1.2, cache_read: 0, cache_write: 0 }, ...overrides,
  }] });
  assert.ok(value);
  return value;
}

// Capture before dispatch: no credential resolution or network inference is needed.
test("offline reasoning diagnostics preserve working transports and guard ignored effort", async (t) => {
  let fetchCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalls++;
    throw new Error("NETWORK DISABLED");
  });

  await t.test("Responses forwards low through max", async () => {
    for (const id of ["gpt-5.6-sol"] as const) {
      const model = getModel("github-copilot", id);
      assertModelApi(model, "openai-responses");
      for (const effort of ["low", "medium", "high", "xhigh", "max"] as const) {
        assert.deepEqual((await capture(streamSimpleOpenAIResponses, model, effort)).reasoning,
          { effort, summary: "auto" });
      }
      assert.equal((await capture(streamOpenAIResponses, model)).reasoning, undefined);
    }
  });
  await t.test("Sol effort follows its declared catalog transport", async () => {
    // Catalog transport migration belongs to the provider lane. Both states must
    // honor their own compatibility instead of invoking a mismatched adapter.
    const model = getModel("github-copilot", "gpt-6.1-sol");
    if (model.api === "openai-responses") {
      assertModelApi(model, "openai-responses");
      assert.ok(getSupportedThinkingLevels(model).includes("max"));
      assert.deepEqual((await capture(streamSimpleOpenAIResponses, model, "max")).reasoning,
        { effort: "max", summary: "auto" });
    } else {
      assertModelApi(model, "openai-completions");
      assert.equal(model.compat?.supportsReasoningEffort, false);
      assert.deepEqual(getSupportedThinkingLevels(model), ["off"]);
      assert.equal((await capture(streamSimpleOpenAICompletions, model, "high")).reasoning_effort, undefined);
    }
  });
  await t.test("MAI Flash maps xhigh to high", async () => {
    const model = getModel("github-copilot", "mai-code-1.1-flash");
    assertModelApi(model, "openai-responses");
    const payload = await capture(streamSimpleOpenAIResponses, model, "xhigh");
    assert.equal((payload.reasoning as Record<string, unknown>).effort, "high");
  });
  await t.test("disabled Completions effort is neither selectable nor sent", async () => {
    for (const id of ["gpt-6-astra", "gpt-6-luna", "claude-fable-5"] as const) {
      const model = getModel("github-copilot", id);
      assertModelApi(model, "openai-completions");
      assert.deepEqual(getSupportedThinkingLevels(model), ["off"]);
      assert.equal(clampThinkingLevel(model, "xhigh"), "off");
      for (const effort of ["low", "high", "xhigh"] as const) {
        assert.equal((await capture(streamSimpleOpenAICompletions, model, effort)).reasoning_effort, undefined);
      }
    }
  });
  await t.test("explicit custom compatibility remains usable", async () => {
    const model = getModel("github-copilot", "gpt-6-astra");
    assertModelApi(model, "openai-completions");
    const custom = {
      ...model, thinkingLevelMap: { xhigh: "xhigh" },
      compat: { ...model.compat, supportsReasoningEffort: true },
    };
    assert.ok(getSupportedThinkingLevels(custom).includes("xhigh"));
    assert.equal((await capture(streamSimpleOpenAICompletions, custom, "xhigh")).reasoning_effort, "xhigh");
  });
  await t.test("all live effort spellings restrict overlay levels", () => {
    for (const metadata of [
      { supportedReasoningEfforts: ["low", "xhigh"] },
      { supported_reasoning_efforts: ["low", "xhigh"] },
      { capabilities: { supports: { reasoning_effort: ["low", "xhigh"] } } },
    ]) {
      const normalized = record("diagnostic-efforts", metadata);
      assert.deepEqual(normalized.execution.reasoningLevels, ["low", "xhigh"]);
      assert.deepEqual(getSupportedThinkingLevels(synthesizeCopilotOverlayEntry(normalized)), ["low", "xhigh"]);
    }
  });
  await t.test("positive live Completions evidence reaches the wire", async () => {
    const model = synthesizeCopilotOverlayEntry(record("diagnostic-completions-effort", {
      supported_endpoints: ["/chat/completions"], supported_reasoning_efforts: ["low", "high", "xhigh"],
    }));
    assertModelApi(model, "openai-completions");
    assert.equal((await capture(streamSimpleOpenAICompletions, model, "xhigh")).reasoning_effort, "xhigh");
  });
  await t.test("empty live lists suppress static fallback", () => {
    assert.deepEqual(record("gpt-5.6-sol", { supported_reasoning_efforts: [] }).execution.reasoningLevels, []);
  });
  await t.test("Opus adaptive aliases survive synthesis, including minimal-to-low", async () => {
    const staticModel = getModel("github-copilot", "claude-opus-4.7");
    assertModelApi(staticModel, "anthropic-messages");
    const overlay = synthesizeCopilotOverlayEntry(record(staticModel.id, { supported_endpoints: ["/v1/messages"] }));
    assertModelApi(overlay, "anthropic-messages");
    for (const effort of ["minimal", "low", "xhigh"] as const) {
      const expected = await capture(streamSimpleAnthropic, staticModel, effort);
      const actual = await capture(streamSimpleAnthropic, overlay, effort);
      assert.deepEqual(actual.thinking, expected.thinking);
      assert.deepEqual(actual.output_config, expected.output_config);
    }
  });
  await t.test("Haiku still uses budgets, not adaptive effort", async () => {
    const model = getModel("github-copilot", "claude-haiku-4.5");
    assertModelApi(model, "anthropic-messages");
    const payload = await capture(streamSimpleAnthropic, model, "high");
    assert.equal((payload.thinking as Record<string, unknown>).type, "enabled");
    assert.equal(payload.output_config, undefined);
  });
  assert.equal(fetchCalls, 0);
});
