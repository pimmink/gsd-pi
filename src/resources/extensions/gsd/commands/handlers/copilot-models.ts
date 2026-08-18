// Project/App: gsd-pi
// File Purpose: /gsd copilot-models — explicit, read-only GitHub Copilot
// model catalog drift check.
//
// This is the production wiring for the read-only fetch/sanitize/diff
// pipeline in `../../copilot-model-catalog.js`. It is intentionally NOT part
// of `/gsd doctor` (doctor-providers.ts is documented as "no HTTP calls, no
// network I/O, always sub-10ms" — see runProviderChecks()) and is NOT part of
// the health-widget's periodic background refresh, which must stay fast and
// network-free. This command is a separate, explicitly user-invoked action so
// the only network call it ever makes is one the user asked for, at the
// moment they asked for it.
//
// Invariants (see .plans/github-copilot-model-catalog-sync-execution.md):
//   - Zero network traffic and zero notifications for sessions without a
//     configured GitHub Copilot credential — the check below reuses
//     ctx.modelRegistry.getAvailable(), which already filters providers by
//     isProviderRequestReady(), so no new auth-detection logic is introduced.
//   - Read-only: never writes to models.json, the model registry, or any
//     provider catalog. Only ever produces a notification.
//   - Never overwrites a known-good in-memory snapshot with an empty or
//     partial response (transient API/auth hiccups keep the last good state).
//   - The in-memory "last known good" snapshot and notified-message set are
//     session-scoped only (module-level state) — nothing is persisted to
//     disk, and neither ever stores the access token, account identity, or
//     request headers.
//
// ADR-012 note: the `.provider === "github-copilot"` check below is a
// legitimate transport-identity check (we need to know specifically whether
// Copilot is configured, not which API shape is in play), and this file is
// listed in the `ALLOWED_FILES` allowlist in
// src/tests/provider-equality-allowlist.test.ts accordingly.

import type { ExtensionCommandContext } from "@gsd/pi-coding-agent";
import { getGitHubCopilotBaseUrl } from "@gsd/pi-ai/oauth";

import {
	applyLastKnownGood,
	dedupeShellNotifications,
	diffCatalogSnapshots,
	fetchGitHubCopilotModels,
	type CopilotModelSnapshot,
} from "../../copilot-model-catalog.js";
import { computeCatalogRegistrationCandidates } from "../../copilot-overlay-writer.js";
import { resolveModelEconomics } from "../../model-cost-table.js";
import {
	getModelProfileConfidence,
	MODEL_CAPABILITY_TIER,
} from "../../model-router.js";

// Session-scoped only — reset on process restart, never written to disk.
let lastKnownGoodSnapshot: CopilotModelSnapshot | null = null;
let notifiedMessages = new Set<string>();

/** Test-only hook to reset module-level session state between test cases. */
export function _resetCopilotModelsSessionStateForTests(): void {
	lastKnownGoodSnapshot = null;
	notifiedMessages = new Set<string>();
}

export interface HandleCopilotModelsOptions {
	fetchImpl?: typeof fetch;
}

function normalizeCommandArgs(args: string): string {
	const trimmed = (args ?? "").trim();
	if (!trimmed || trimmed === "sync" || trimmed === "changes") return "sync";
	if (trimmed === "register") return "register";
	if (trimmed === "pricing") return "pricing";
	if (trimmed === "promos") return "promos";
	if (trimmed === "doctor") return "doctor";
	if (trimmed.startsWith("why ")) return "why";
	if (trimmed.startsWith("why")) return "why";
	return "sync";
}

function formatModelPrice(modelIdLike: string | { id: string }): string {
	const modelId =
		typeof modelIdLike === "string" ? modelIdLike : modelIdLike.id;
	const bareId = modelId.includes("/")
		? (modelId.split("/").pop() ?? modelId)
		: modelId;
	const economics = resolveModelEconomics({
		provider: "github-copilot",
		modelId: bareId,
		fallbackEconomics: {
			source: "bundled-fallback",
			stale: false,
			billingUnit: "tokens",
		},
	});
	const prices = economics.tokenPrices?.default ?? {
		inputPer1k: 0,
		outputPer1k: 0,
	};
	const input = Number.isFinite(prices.inputPer1k) ? prices.inputPer1k : 0;
	const output = Number.isFinite(prices.outputPer1k) ? prices.outputPer1k : 0;

	if (input === 0 && output === 0 && !MODEL_CAPABILITY_TIER[bareId]) {
		return `- ${modelId}: pricing unavailable (manual override required)`;
	}

	return `- ${modelId}: $${input.toFixed(4)} per 1K input / $${output.toFixed(4)} per 1K output (${economics.source})`;
}

function formatModelWhy(
	modelId: string,
	snapshot: CopilotModelSnapshot | null,
): string {
	const bareId = modelId.includes("/")
		? (modelId.split("/").pop() ?? modelId)
		: modelId;
	const tier = MODEL_CAPABILITY_TIER[bareId] ?? "standard";
	const confidence = getModelProfileConfidence(bareId);
	const economics = resolveModelEconomics({
		provider: "github-copilot",
		modelId: bareId,
		fallbackEconomics: {
			source: "bundled-fallback",
			stale: false,
			billingUnit: "tokens",
		},
	});
	const prices = economics.tokenPrices?.default ?? {
		inputPer1k: 0,
		outputPer1k: 0,
	};
	const catalogStatus = snapshot?.models.some(
		(candidate) => candidate.id === modelId || candidate.id === bareId,
	)
		? "available in the live catalog"
		: "not currently in the last live catalog snapshot";
	const manualHint =
		confidence === "unknown"
			? "manual selection only; not auto-routed when a profiled model is eligible."
			: "profile-backed and eligible for automatic routing when the tier remains suitable.";

	return [
		`GitHub Copilot: why ${modelId}`,
		`- tier: ${tier}`,
		`- capability profile: ${confidence}`,
		`- pricing: $${prices.inputPer1k.toFixed(4)} per 1K input / $${prices.outputPer1k.toFixed(4)} per 1K output`,
		`- status: ${catalogStatus}`,
		`- routing note: ${manualHint}`,
	].join("\n");
}

async function refreshCopilotSnapshot(
	ctx: ExtensionCommandContext,
	options: HandleCopilotModelsOptions,
): Promise<{
	ok: boolean;
	error?: string;
	snapshot: CopilotModelSnapshot | null;
}> {
	const available = ctx.modelRegistry.getAvailable();
	const copilotModel = available.find(
		(model) => model.provider === "github-copilot",
	);

	if (!copilotModel) {
		return {
			ok: false,
			error: "missing github-copilot provider",
			snapshot: null,
		};
	}

	const token = await ctx.modelRegistry.getApiKey(copilotModel);
	if (!token) {
		return { ok: false, error: "missing access token", snapshot: null };
	}

	const baseUrl = getGitHubCopilotBaseUrl(token);

	try {
		const result = await fetchGitHubCopilotModels({
			provider: "github-copilot",
			authToken: token,
			baseUrl,
			fetchImpl: options.fetchImpl,
		});
		const ok = !result.skipped && result.models.length > 0 && !!result.snapshot;
		return { ok, snapshot: ok ? result.snapshot! : null };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
			snapshot: null,
		};
	}
}

export async function handleCopilotModels(
	_args: string,
	ctx: ExtensionCommandContext,
	options: HandleCopilotModelsOptions = {},
): Promise<void> {
	const command = normalizeCommandArgs(_args);
	const available = ctx.modelRegistry.getAvailable();
	const copilotModel = available.find(
		(model) => model.provider === "github-copilot",
	);

	if (!copilotModel) {
		ctx.ui.notify(
			"GitHub Copilot is not configured for this session — run /login to sign in. No network request was made.",
			"info",
		);
		return;
	}

	const token = await ctx.modelRegistry.getApiKey(copilotModel);
	if (!token) {
		ctx.ui.notify(
			"GitHub Copilot is configured but no access token could be resolved — try /login again.",
			"warning",
		);
		return;
	}

	const fetchOutcome = await refreshCopilotSnapshot(ctx, options);
	if (!lastKnownGoodSnapshot && !fetchOutcome.ok) {
		ctx.ui.notify(
			`GitHub Copilot model catalog unavailable (${fetchOutcome.error ?? "empty response"}) — no cached catalog yet, nothing was changed.`,
			"warning",
		);
		return;
	}

	if (
		!fetchOutcome.ok &&
		command !== "pricing" &&
		command !== "doctor" &&
		command !== "why" &&
		command !== "promos"
	) {
		ctx.ui.notify(
			`GitHub Copilot model catalog refresh failed (${fetchOutcome.error ?? "empty response"}) — showing the last known catalog, nothing was changed.`,
			"warning",
		);
		return;
	}

	if (fetchOutcome.ok) {
		const previousSnapshot = lastKnownGoodSnapshot;
		const nextSnapshot = previousSnapshot
			? applyLastKnownGood(previousSnapshot, fetchOutcome)
			: fetchOutcome.snapshot!;
		lastKnownGoodSnapshot = nextSnapshot;

		if (command === "pricing") {
			const lines = nextSnapshot.models.map(formatModelPrice);
			ctx.ui.notify(
				["GitHub Copilot pricing snapshot:", ...lines].join("\n"),
				"info",
			);
			return;
		}

		if (command === "promos") {
			ctx.ui.notify(
				"GitHub Copilot promos: no active promo feed is tracked in the bundled GSD catalog. Price changes are surfaced through the live catalog and term-aware economics layer instead.",
				"info",
			);
			return;
		}

		if (command === "doctor") {
			const stale =
				previousSnapshot !== null &&
				nextSnapshot.generatedAt !== previousSnapshot.generatedAt;
			const lines = [
				"GitHub Copilot doctor:",
				`- configured: yes`,
				`- live models: ${nextSnapshot.models.length}`,
				`- last contact: ${nextSnapshot.generatedAt}`,
				`- catalog stale: ${stale ? "yes" : "no"}`,
				`- tracked snapshot: ${lastKnownGoodSnapshot ? "cached" : "none"}`,
			];
			ctx.ui.notify(lines.join("\n"), "info");
			return;
		}

		if (command === "why") {
			const rawModel = (_args ?? "")
				.trim()
				.replace(/^why\s+/i, "")
				.trim();
			const targetModel = rawModel || nextSnapshot.models[0]?.id || "gpt-5.4";
			ctx.ui.notify(formatModelWhy(targetModel, nextSnapshot), "info");
			return;
		}

		if (command === "register") {
			const effectiveLocal = ctx.modelRegistry.getAvailable().filter(
				(model) => model.provider === "github-copilot",
			);
			const candidates = computeCatalogRegistrationCandidates(
				nextSnapshot.models,
				effectiveLocal,
			);

			if (candidates.length === 0) {
				ctx.ui.notify(
					"GitHub Copilot registration: no remote-only models were found; the effective local catalog already covers the live catalog.",
					"info",
				);
				return;
			}

			ctx.ui.notify(
				[
					`GitHub Copilot registration: ${candidates.length} model(s) quarantined and not persisted.`,
					"Remote-only live catalog entries were kept quarantined because the effective local catalog is authoritative and unknown metadata must never be materialized as concrete truth.",
					...candidates.map((model) => `- ${model.id}`),
				].join("\n"),
				"warning",
			);
			return;
		}

		if (!previousSnapshot) {
			ctx.ui.notify(
				`GitHub Copilot model catalog: ${nextSnapshot.models.length} model(s) available.`,
				"info",
			);
			return;
		}

		const diff = diffCatalogSnapshots(previousSnapshot, nextSnapshot);
		const messages: string[] = [
			...diff.added.map(
				(model) => `+ ${model.id} added to the GitHub Copilot catalog`,
			),
			...diff.removed.map(
				(model) => `- ${model.id} removed from the GitHub Copilot catalog`,
			),
			...diff.changed.map(
				(model) => `~ ${model.id} changed in the GitHub Copilot catalog`,
			),
		];

		const deduped = dedupeShellNotifications(messages);
		const unseen = deduped.filter((message) => !notifiedMessages.has(message));
		for (const message of deduped) notifiedMessages.add(message);

		if (unseen.length === 0) {
			ctx.ui.notify(
				"GitHub Copilot model catalog: no new changes since the last check.",
				"info",
			);
			return;
		}

		ctx.ui.notify(
			["GitHub Copilot model catalog changes:", ...unseen].join("\n"),
			"info",
		);
		return;
	}

	if (command === "pricing") {
		const snapshot = lastKnownGoodSnapshot;
		if (!snapshot) {
			ctx.ui.notify(
				"GitHub Copilot pricing unavailable — no cached catalog snapshot exists yet.",
				"warning",
			);
			return;
		}
		const lines = snapshot.models.map(formatModelPrice);
		ctx.ui.notify(
			["GitHub Copilot pricing snapshot:", ...lines].join("\n"),
			"info",
		);
		return;
	}

	if (command === "promos") {
		ctx.ui.notify(
			"GitHub Copilot promos: no active promo feed is tracked in the bundled GSD catalog. Price changes are surfaced through the live catalog and term-aware economics layer instead.",
			"info",
		);
		return;
	}

	if (command === "doctor") {
		const snapshot = lastKnownGoodSnapshot ?? null;
		const lines = [
			"GitHub Copilot doctor:",
			`- configured: yes`,
			`- live models: ${snapshot?.models.length ?? 0}`,
			`- last contact: ${snapshot?.generatedAt ?? "never"}`,
			`- catalog stale: ${snapshot ? "database snapshot cached but last fetch failed" : "no cached catalog"}`,
		];
		ctx.ui.notify(lines.join("\n"), "warning");
		return;
	}

	if (command === "why") {
		const rawModel = (_args ?? "")
			.trim()
			.replace(/^why\s+/i, "")
			.trim();
		const targetModel =
			rawModel || lastKnownGoodSnapshot?.models[0]?.id || "gpt-5.4";
		ctx.ui.notify(formatModelWhy(targetModel, lastKnownGoodSnapshot), "info");
		return;
	}

	ctx.ui.notify(
		`GitHub Copilot model catalog refresh failed (${fetchOutcome.error ?? "empty response"}) — showing the last known catalog, nothing was changed.`,
		"warning",
	);
}
