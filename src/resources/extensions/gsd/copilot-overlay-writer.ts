import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isModelsCatalogOverlay, type ModelsCatalogOverlay } from "@gsd/pi-ai";

import type { CopilotModelRecord } from "./copilot-model-catalog.js";

export interface CatalogRegistrationCandidate extends CopilotModelRecord {
	quarantineReason: string;
}

export interface CatalogRegistrationPlan {
	overlay: ModelsCatalogOverlay;
	persisted: CatalogRegistrationCandidate[];
	quarantined: CatalogRegistrationCandidate[];
}

export function computeCatalogRegistrationCandidates(
	remoteModels: CopilotModelRecord[],
	localModels: Array<{ id: string; provider?: string }> = [],
): CatalogRegistrationCandidate[] {
	const localIds = new Set(
		localModels
			.filter((model) => !model.provider || model.provider === "github-copilot")
			.map((model) => model.id),
	);

	return remoteModels
		.filter((model) => model.tool_call === true && !localIds.has(model.id))
		.map((model) => ({
			...model,
			quarantineReason:
				"remote-only GitHub Copilot model detected; kept quarantined because the effective local catalog is authoritative and unknown metadata must not be persisted as concrete truth.",
		}));
}

export function registerCopilotModelsInOverlay(
	existingOverlay: ModelsCatalogOverlay | null | undefined,
	remoteModels: CopilotModelRecord[],
	localModels: Array<{ id: string; provider?: string }> = [],
): CatalogRegistrationPlan {
	const overlay: ModelsCatalogOverlay = existingOverlay && isModelsCatalogOverlay(existingOverlay)
		? existingOverlay
		: { version: 1, models: {} };

	const quarantined = computeCatalogRegistrationCandidates(remoteModels, localModels);
	const persisted: CatalogRegistrationCandidate[] = [];

	return {
		overlay,
		persisted,
		quarantined,
	};
}

export function readModelsCatalogOverlay(path: string): ModelsCatalogOverlay | null {
	try {
		if (!existsSync(path)) return null;
		const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
		return isModelsCatalogOverlay(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function writeModelsCatalogOverlay(path: string, overlay: ModelsCatalogOverlay): void {
	const tmpPath = `${path}.tmp-${process.pid}`;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(tmpPath, `${JSON.stringify(overlay, null, 2)}\n`);
	renameSync(tmpPath, path);
}
