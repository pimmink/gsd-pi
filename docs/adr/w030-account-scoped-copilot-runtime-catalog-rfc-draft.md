# W030 RFC Draft: Account-Scoped Copilot Runtime Catalog

Status: Draft for maintainer approval

## Problem

The session-start Copilot catalog refresh computes Class A, B, and C
classifications, but the result is not consumed by the runtime model registry or
the interactive picker. Existing extension seams cannot fix this safely:

- `registerProvider()` replaces every model for a provider.
- `discoverModels()` synthesizes zero cost and default token limits when the
  provider omitted those values.
- `Model` has mandatory cost and token-limit fields, so it cannot represent
  provider facts that are genuinely unknown.

## Proposed Contract

Add an additive, account-scoped runtime catalog layer. It must remain separate
from bundled models, `models.json`, and `models-catalog.json`.

1. Add a runtime descriptor type that carries a complete executable `Model` plus
   explicit metadata: `accountScope`, `catalogRole`, `manualSelectability`,
   `automaticRoutingEligible`, `economicsKnown`, `limitsKnown`, and provenance.
2. Add `ModelRegistry.setAccountScopedModels(provider, accountScope, models)` and
   `ModelRegistry.clearAccountScopedModels(provider, accountScope)`. These are
   additive, deduplicate by provider/model ID, and never replace static or user
   models.
3. Add scoped registry reads for the picker. Class A and B records may appear
   only for the active account scope; Class C never appears in selectable reads.
4. Map successful Copilot refresh results into the new layer:
   - Class A: selectable and automatically routable when its trusted routing
     profile permits it.
   - Class B: selectable manually, never automatically routed or suggested.
   - Class C: diagnostic-only.
5. Persist a sanitized last-known-good snapshot and refresh timestamp keyed by a
   stable account identity, not only project path. Rotated access credentials for
   the same account keep their snapshot; a different account cannot read it.

## Safety Rules

- No provider request is made solely to probe compatibility during startup.
- Missing provider metadata remains unknown. It must not be converted to false,
  zero, or default token limits.
- Runtime descriptors with unknown economics are excluded from savings
  comparisons and numeric cost displays.
- Runtime descriptors with unknown limits are excluded from automatic routing and
  context-budget assumptions.
- The picker must not show embedding, internal-service, or deployment-alias
  records as user chat models.
- Neither bundled catalog files nor arbitrary user `models.json` files are
  written or mutated.

## Required Tests

- Additive registry registration preserves bundled and user models.
- Repeated refresh is idempotent and never duplicates a provider/model ID.
- Class A, B, and C flow from refresh classification to registry and picker.
- Class B is manually selectable but excluded from automatic routing and
  suggestions.
- Class C is never selectable.
- Account A data cannot appear in account B; credential rotation retains A's
  last-known-good snapshot.
- `if_stale` survives process restart using the sanitized account-scoped cache.
- A picker opened during refresh joins only the existing bounded refresh promise.
- No runtime activation mutates static catalog files or `models.json`.

## Non-Goals

- No new Copilot login flow, SDK dependency, or live compatibility probe.
- No hardcoded provider pricing or model profiles.
- No automatic model switching.
- No selection-origin contract change; that remains a separate follow-up after
  this RFC.

## Issue Draft

Title: RFC: Add an account-scoped runtime model catalog for GitHub Copilot

Body:

> Session-start Copilot refresh already produces sanitized Class A/B/C model
> classifications, but they do not reach ModelRegistry or the picker. Existing
> extension seams are unsafe because provider registration replaces the entire
> provider set and discovery synthesizes absent economics/limits. This RFC
> proposes an additive account-scoped runtime catalog layer, preserving unknown
> metadata and keeping it separate from bundled and user-owned catalog files.
>
> The attached contract deliberately supports manual-only models without making
> them candidates for automatic routing or pricing suggestions. It needs
> maintainer approval because it crosses the GSD core extension, ModelRegistry,
> and interactive picker boundaries.

## Draft PR Plan

Open only after the RFC issue has maintainer approval.

Base: `upstream/main`

Branch: `fix/copilot-runtime-catalog-activation`

Title: `draft: fix(gsd): activate account-scoped Copilot runtime catalog`

PR summary:

> Implements the approved account-scoped runtime catalog contract for sanitized
> Copilot refresh results. Class A models can participate in routing only with a
> trusted GSD profile; Class B models remain manual-only; Class C remains
> diagnostic-only. The change does not modify `models.json`, the bundled catalog,
> or provider authentication.