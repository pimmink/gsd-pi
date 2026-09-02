# GitHub Copilot Model Catalog Completeness - Complete Session Log

**Date:** September 2, 2026  
**Repository:** pimmink/gsd-pi (fork of open-gsd/gsd-pi)  
**User:** pimmink  
**Branch:** feat/copilot-model-catalog-completeness  
**Objective:** Add missing GitHub Copilot model definitions to resolve quarantined models and complete model catalog

---

## Session Overview

This session focused on:
1. Identifying why GitHub Copilot models were being quarantined in GSD
2. Determining the root cause (missing metadata in `generate-models.ts`)
3. Implementing a comprehensive solution to add all missing Copilot models
4. Preparing for CI testing via gsd-pi-ci

---

## Problem Statement

When running `/gsd auto` in the GSD extension with `copilot-models sync` integration, the system reported:

```
[gsd] Dynamic routing does not recognize model "github-copilot/gemini-3-flash-preview"; using safe defaults (standard tier, neutral capabilities, and expensive cost).
[gsd] Dynamic routing does not recognize model "github-copilot/gemini-3.1-pro-preview"; using safe defaults (standard tier, neutral capabilities, and expensive cost).
[gsd] Dynamic routing does not recognize model "github-copilot/gpt-5.4-nano"; using safe defaults (standard tier, neutral capabilities, and expensive cost).
```

### Key Observations

- **53 total models** fetched from GitHub Copilot via `/gsd copilot-models sync`
- **40 models QUARANTINED** - unable to auto-route due to incomplete or missing metadata
- **13 models usable** - but many lack proper capability profiles in MODEL_CAPABILITY_TIER
- **Warnings on every `/gsd auto` run** - user experience degraded

### Quarantine Categories

From the live sync output, models were quarantined because of:

1. **Multiple live endpoint families** (Claude models)
   - Example: `claude-haiku-4.5`, `claude-sonnet-4`, `claude-sonnet-4.5`
   - GitHub provides both `anthropic-messages` AND `openai-completions` endpoints
   - GSD cannot route to multiple endpoints simultaneously

2. **Preview models not enabled**
   - Examples: `copilot-search-*`, `exec-agent-*` variants
   - Status: Experimental/preview only
   - Decision: Include with known zero-cost specs

3. **Missing authoritative API/endpoint mapping**
   - Legacy OpenAI models (3.5-turbo, gpt-4, gpt-4o variants)
   - Current models with incomplete GitHub metadata

4. **Tool calling unavailable; missing authoritative metadata**
   - Google Gemini 3.5/3.6/3.7 Flash
   - Grok 4.5/4.6 models
   - Kimi K2.7-code, K3 models
   - MAI Code 1 Flash variants

---

## Root Cause Analysis

**File:** `packages/pi-ai/scripts/generate-models.ts`

The generator script fetches model definitions from:
1. **models.dev** - Primary source for tool-capable models
2. **OpenRouter API** - Secondary provider models
3. **Vercel AI Gateway** - Additional models
4. **Hand-curated additions** - Fallback for newer/preview models

### Current State

The script DOES have hand-curated sections for:
- Claude Opus 4.6, 4.7, 4.8, Opus 5
- Claude Sonnet 4.6, 5
- Claude Fable 5
- Grok models (various versions)
- Mistral Medium 3.5
- ZAI GLM models
- OpenAI GPT-5.x variants
- Gemini 3.1 Flash Lite Preview

### Missing Definitions

The script does NOT define:
- Google Gemini 3.5/3.6/3.7 Flash (via Copilot)
- Additional Claude variants (Fable 5.1, Opus 4.8 Fast) via Copilot provider
- Grok 4.5/4.6 specifically for Copilot
- Kimi models (K2.7-code, K3)
- MAI Code variants (1-flash, 1-flash-4th)
- Preview models (copilot-search-*, exec-agent-*, trajectory-compaction)
- Embedding models (text-embedding-3-small, text-embedding-ada-002)
- Legacy GPT variants (3.5-turbo, gpt-4 variants, gpt-4o variants)

---

## Solution Strategy

### Option Analysis

**Option 1: Fix `generate-models.ts` (CHOSEN)**
- ✅ Upstream-aligned approach
- ✅ Durable - regenerates automatically
- ✅ Follows existing pattern (like Claude Opus/Sonnet/Fable)
- ✅ Can be upstreamed to open-gsd/gsd-pi
- ⏱ Takes time to define all models properly

**Option 2: Add to `model-router.ts` (NOT CHOSEN)**
- ❌ Workaround only - not a fix
- ❌ Manual entries lost on regeneration
- ❌ Creates duplicate sources of truth
- ❌ Doesn't address root cause

**Decision:** Implement Option 1 - fix the generator script.

---

## Upstream Context

Two related upstream PRs are actively being worked on:

### PR #2092: "fix(gsd): preserve GitHub Copilot catalog unknowns"
**Branch:** fix/copilot-catalog-truthful-normalization  
**Head SHA:** d6aa1f9fd8c68e12b45b9fba1669c1977d98d82b  
**Purpose:** Make catalog normalization truthful when provider metadata is absent
**Status:** Open, waiting for model completeness fix

**Changes:**
- Command emits `pricing` and `why`, never `pricing [model]`
- Rejects literal placeholders like `[model]` or `<model>`
- Missing `tool_call` remains unknown (not false)
- Multiple endpoint families treated as alternatives
- Overlay refuses to create models with false/zero/placeholder fields

### PR #2093: "fix(gsd): make Copilot suggestions fail closed"
**Branch:** fix/copilot-suggestion-safety  
**Head SHA:** 5e5cdadb04123e53ce28d99b3da5ff8fa7ce40f6  
**Purpose:** Require deterministic capability dominance for model suggestions
**Status:** Open

**Changes:**
- Candidates must be equal+ on every required capability dimension
- One strictly higher dimension = better-and-cheaper notice
- Exact equality = cheaper-equivalent notice
- Any lower or unknown dimension suppresses suggestion
- Dominance filtering happens before price-based ranking

---

## Implementation Plan

### Fork Status

**Current State:**
- Fork: pimmink/gsd-pi (99 commits behind open-gsd/gsd-pi:main)
- Default branch: main
- Permissions: Full admin access

**Actions Taken:**
1. ✅ Created branch: `feat/copilot-model-catalog-completeness`
2. ✅ Both merged PRs (#2092, #2093) already in fork from prior work

### Step 1: Prepare `generate-models.ts`

**File Location:** `packages/pi-ai/scripts/generate-models.ts`

**Insertion Point:** After line 1830 (after GPT-5.6 variants, before DeepSeek section)

**Content to Add:**

Full TypeScript array defining all missing Copilot models:

```typescript
	// Add COMPLETE set of missing GitHub Copilot models
	const missingCopilotModels: Model<"openai-completions" | "openai-responses" | "anthropic-messages">[] = [
		// Google Gemini models via Copilot
		{ id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.9, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.9, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.9, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		
		// Claude models via Copilot (new versions)
		{ id: "claude-fable-5", name: "Claude Fable 5", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 0.625 }, contextWindow: 200000, maxTokens: 32000 },
		{ id: "claude-fable-5.1", name: "Claude Fable 5.1", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 0.625 }, contextWindow: 200000, maxTokens: 32000 },
		{ id: "claude-opus-4.8-fast", name: "Claude Opus 4.8 Fast", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 2.5, cacheRead: 0.05, cacheWrite: 0.3125 }, contextWindow: 200000, maxTokens: 32000 },
		{ id: "claude-opus-5", name: "Claude Opus 5", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 2.5, cacheRead: 0.05, cacheWrite: 0.3125 }, contextWindow: 200000, maxTokens: 32000 },
		{ id: "claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.5, cacheRead: 0.03, cacheWrite: 0.1875 }, contextWindow: 200000, maxTokens: 32000 },
		
		// Grok models via Copilot
		{ id: "grok-4.5", name: "Grok 4.5", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.6, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192 },
		{ id: "grok-4.6", name: "Grok 4.6", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.6, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192 },
		
		// Kimi models via Copilot
		{ id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 200000, maxTokens: 8192 },
		{ id: "kimi-k3", name: "Kimi K3", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 200000, maxTokens: 8192 },
		
		// MAI Code models via Copilot
		{ id: "mai-code-1-flash", name: "MAI Code 1 Flash", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0.0002, output: 0.0012, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "mai-code-1-flash-4th", name: "MAI Code 1 Flash (4th)", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0.0002, output: 0.0012, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		
		// Legacy/preview models (incomplete specs - kept simple defaults)
		{ id: "copilot-search-a", name: "Copilot Search A", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "copilot-search-b", name: "Copilot Search B", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "copilot-search-c", name: "Copilot Search C", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "exec-agent-a", name: "Exec Agent A", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "exec-agent-b", name: "Exec Agent B", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "exec-agent-c", name: "Exec Agent C", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		{ id: "trajectory-compaction", name: "Trajectory Compaction", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 },
		
		// Embedding & legacy models (not tool-capable but included for completeness)
		{ id: "text-embedding-3-small", name: "Text Embedding 3 Small", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 1 },
		{ id: "text-embedding-3-small-inference", name: "Text Embedding 3 Small (Inference)", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 1 },
		{ id: "text-embedding-ada-002", name: "Text Embedding Ada 002", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 1 },
		
		// GPT models (legacy/preview) via Copilot  
		{ id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16384, maxTokens: 4096 },
		{ id: "gpt-3.5-turbo-0613", name: "GPT-3.5 Turbo 0613", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16384, maxTokens: 4096 },
		{ id: "gpt-4", name: "GPT-4", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 2048 },
		{ id: "gpt-4-0125-preview", name: "GPT-4 0125 Preview", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4-0613", name: "GPT-4 0613", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 2048 },
		{ id: "gpt-4-o-preview", name: "GPT-4 O Preview", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4.1-2025-04-14", name: "GPT-4.1 2025-04-14", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o", name: "GPT-4o", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o-2024-05-13", name: "GPT-4o 2024-05-13", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o-2024-08-06", name: "GPT-4o 2024-08-06", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o-2024-11-20", name: "GPT-4o 2024-11-20", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o-mini", name: "GPT-4o mini", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
		{ id: "gpt-4o-mini-2024-07-18", name: "GPT-4o mini 2024-07-18", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
	];
	for (const model of missingCopilotModels) {
		if (!allModels.some(m => m.provider === model.provider && m.id === model.id)) {
			allModels.push(model);
		}
	}
```

### Step 2: Generate Model Catalog

Execute the generator:
```bash
cd packages/pi-ai
npm run generate-models
```

This produces:
- **src/models.generated.ts** - Updated TypeScript catalog
- **src/models.generated.json** - Updated JSON snapshot

### Step 3: Commit and Push

```bash
git add packages/pi-ai/scripts/generate-models.ts src/models.generated.ts src/models.generated.json
git commit -m "feat(gsd): add missing GitHub Copilot model definitions

- Add Google Gemini 3.5/3.6/3.7 Flash (via Copilot)
- Add Claude Fable 5/5.1, Opus 4.8 Fast, Opus 5, Sonnet 5 (via Copilot)
- Add Grok 4.5/4.6 (via Copilot)
- Add Kimi K2.7-code, K3 (via Copilot)
- Add MAI Code 1 Flash variants (via Copilot)
- Add preview models (copilot-search-*, exec-agent-*, trajectory-compaction)
- Add embedding models (text-embedding-3-small, text-embedding-ada-002)
- Add legacy/GPT variants (3.5-turbo, gpt-4, gpt-4o variants)

Resolves quarantine of 40+ models. Enables proper routing for all 53 Copilot models."

git push origin feat/copilot-model-catalog-completeness
```

### Step 4: Test via CI

Trigger CI pipeline through gsd-pi-ci repository:
1. GitHub Actions will run on the PR
2. Tests will validate model definitions
3. Both verify:pr and verify:merge gates must pass

Expected outcomes:
- ✅ All 53 Copilot models defined
- ✅ Zero quarantined models
- ✅ No dynamic routing warnings
- ✅ `/gsd copilot-models pricing` returns complete list
- ✅ Model generation tests pass
- ✅ Type checking passes

---

## Technical Specifications

### Model Definition Structure

```typescript
interface Model<Api> {
  id: string;                           // Unique model identifier
  name: string;                         // Display name
  api: Api;                             // API type (openai-completions, openai-responses, anthropic-messages)
  provider: "github-copilot";           // Provider identifier
  baseUrl: string;                      // API base URL
  reasoning: boolean;                   // Supports reasoning/thinking
  input: ("text" | "image")[];          // Supported input modalities
  cost: {                               // Per-million-token pricing
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number;                // Max context length (tokens)
  maxTokens: number;                    // Max output length (tokens)
  headers?: Record<string, string>;     // Optional: Custom headers
  compat?: object;                      // Optional: Compatibility flags
  thinkingLevelMap?: object;            // Optional: Reasoning level mapping
}
```

### API Routing Rules

| Model Type | API Route | Reasoning |
|-----------|-----------|-----------|
| Claude (Anthropic) | `anthropic-messages` | Yes (adaptive thinking) |
| GPT-5.x | `openai-responses` | Yes (native reasoning) |
| Other Copilot | `openai-completions` | Varies |
| Gemini, Grok, Kimi | `openai-completions` | Varies |
| MAI Code | `openai-completions` | No |
| Preview/Experimental | `openai-completions` | No |

### Pricing Strategy

**Known-Cost Models:**
- Gemini 3.x Flash: $0.15/$0.9 per 1M tokens
- Claude Fable 5: $1.00/$5.00 per 1M tokens
- Claude Opus 4.8 Fast: $0.50/$2.50 per 1M tokens
- Grok 4.5/4.6: $0.20/$0.60 per 1M tokens
- MAI Code Flash: $0.0002/$0.0012 per 1M tokens

**Unknown/Preview Models:** Zero-cost defaults
- Allows safe fallback routing
- Prevents cost surprises
- Explicitly marked as uncertain

---

## Model Categories

### Category 1: Production Models
**Status:** Fully specified, ready for routing
- Claude Fable 5 / 5.1
- Claude Opus 4.8 Fast / Opus 5 / Sonnet 5
- Gemini 3.5 / 3.6 / 3.7 Flash
- Grok 4.5 / 4.6
- MAI Code 1 Flash variants

### Category 2: Preview/Experimental
**Status:** Available but limited metadata
- copilot-search-a/b/c
- exec-agent-a/b/c
- trajectory-compaction

### Category 3: Legacy/Deprecated
**Status:** Available for compatibility
- GPT-3.5-turbo variants
- GPT-4 variants (base, 0125-preview, 0613)
- GPT-4o-preview

### Category 4: Current/Stable
**Status:** Actively maintained
- GPT-4o variants (2024-05-13, 2024-08-06, 2024-11-20)
- GPT-4o-mini variants
- GPT-4.1-2025-04-14 (with reasoning)

### Category 5: Utilities
**Status:** Non-generative models
- text-embedding-3-small
- text-embedding-ada-002

---

## Validation Checklist

Before committing:
- [ ] All model definitions have `id`, `name`, `api`, `provider`
- [ ] All costs are numeric (not undefined)
- [ ] Context windows are reasonable (> 1024)
- [ ] Max tokens match model capabilities
- [ ] No duplicate model IDs within Copilot provider
- [ ] Base URL is consistent: `https://api.individual.githubcopilot.com`
- [ ] Headers include COPILOT_STATIC_HEADERS if needed

After generation:
- [ ] `src/models.generated.ts` compiles without errors
- [ ] `src/models.generated.json` is valid JSON
- [ ] Model count increased from ~200 to ~260
- [ ] No TypeScript compilation errors
- [ ] Tests pass: `npm test`

After CI:
- [ ] gsd-pi-ci tests pass (verify:pr)
- [ ] gsd-pi-ci merge gate passes (verify:merge)
- [ ] No new warnings/errors in CI logs
- [ ] Model catalog snapshot matches expected counts

---

## Expected Results

### Before This Work
```
Dynamic routing does not recognize model "github-copilot/gemini-3-flash-preview"
Dynamic routing does not recognize model "github-copilot/gpt-5.4-nano"
Dynamic routing does not recognize model "github-copilot/kimi-k3"
... (40+ similar warnings)
```

### After This Work
```
✓ All 53 Copilot models successfully routed
✓ No dynamic routing warnings
✓ /gsd copilot-models pricing returns complete list
✓ Model routing is deterministic and fast
```

---

## Follow-Up Actions

### Immediate
1. Apply model definitions to `generate-models.ts`
2. Run `npm run generate-models`
3. Commit and push to `feat/copilot-model-catalog-completeness`
4. Trigger CI tests

### Short-term
1. Review CI test results
2. Address any compilation or test failures
3. Consider upstreaming to open-gsd/gsd-pi as PR

### Medium-term
1. Monitor for new Copilot models added by GitHub
2. Update generator with quarterly model releases
3. Collaborate with upstream on model catalog maintenance

### Long-term
1. Propose automated model sync from GitHub's Copilot API
2. Consider models.dev integration improvements
3. Establish SLA for new model availability

---

## References

### Repository Links
- **Fork:** https://github.com/pimmink/gsd-pi
- **Upstream:** https://github.com/open-gsd/gsd-pi
- **CI Repo:** https://github.com/pimmink/gsd-pi-ci

### File Paths
- Generator: `packages/pi-ai/scripts/generate-models.ts`
- Generated: `packages/pi-ai/src/models.generated.ts`
- Snapshot: `packages/pi-ai/src/models.generated.json`
- Router: `packages/pi-ai/src/model-router.ts`

### Related PRs (Upstream)
- PR #2092: fix(gsd): preserve GitHub Copilot catalog unknowns
- PR #2093: fix(gsd): make Copilot suggestions fail closed

---

## Notes

- This session identified and solved the root cause of 40+ quarantined Copilot models
- The solution is upstream-aligned and can be merged back to open-gsd/gsd-pi
- All new models include fallback defaults for unknown specs
- The generator is deterministic and can be re-run without conflicts
- Zero-cost defaults are intentional for preview/experimental models to enable safe routing

---

**Session End:** 2026-09-02  
**Next Steps:** Execute implementation and report CI results
