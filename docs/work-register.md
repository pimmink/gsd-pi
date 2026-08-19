<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-19**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | PR required | — | — | `feat/github-copilot-model-catalog-sync` | Complete — exact-sha **sharded** remote verification passed on SHA `3f1bcf0f79a27a6a25f40c6407aa1c153b91c474` with build + lifecycle-shadow gate + all 4 test shards plus the aggregate fail-closed gate green (run `32242571833`); supersedes earlier W014 remote proofs at `26ae1e55`/`32203423874` and `4bdb8909`/`32199524656`. | No overlapping upstream issue or PR was found; use the prepared local issue/PR drafts and open the upstream contribution only after explicit GitHub-write authorization. |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |

## Completed or historical work

| ID | Work | Scope | Upstream | Issues | PRs | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| GSD-W001 | Extension registry lockSync ESYNC | Upstream | Historical | #1598 | — | Issue closed; regression no longer active |
| GSD-W003 | Milestone status dependency visibility | Upstream | Historical | #1601 | — | Issue closed; `dependsOn` is exposed by the status tool |
| GSD-W002 | Markdown renderer markdownlint compliance | Upstream | Historical | #1600 | #1610 | Merged in `e7b6f291ac680f1b00fe1cb6ca246b8cbcac3aac` (2026-08-16) |
| GSD-W004 | Legacy migration slice/decision consistency | Upstream | Historical | #1606, #1607 | #1611 | Merged in `8d1d2067b1ec5b0b06e8772033b6f6f848b7613d` |
| GSD-W005 | Canonical requirement/decision read tools | Upstream | Historical | #1608 | #1613, #1682 | Closed unmerged; active correctness follow-ups are GSD-W008 through GSD-W010 |
| GSD-W006 | Sonnet 5 routing and Copilot fallback | Upstream | Historical | #1612 | #1609, #1703, #1705 | All three PRs merged upstream |
| GSD-W007 | Package-manager-aware verification and bootstrap recovery | Upstream | Historical | — | #1706 | Merged in `85b334d4c0d77fe8c88ec5e000966f4ca8ba7092` (2026-08-16) |
| GSD-W008 | Canonical read DB isolation | Upstream | Historical | #1727 | #1731 | Merged in `10aa03954444e51390160f00a1d97a59d4a8604f` (2026-08-14) |
| GSD-W009 | Canonical SQL predicates before LIMIT | Upstream | Historical | #1728 | #1732 | Merged in `da908349835815274d2b2d097da50880d3c44f33` (2026-08-16) |
| GSD-W010 | Native/MCP canonical read error parity | Upstream | Historical | #1729 | #1734 | Merged in `e728a95714c7fa78cb2f41c91d978a93e6e56a5f` (2026-08-16) |
| GSD-W011 | MAI Code 1.1 Flash Copilot routing | Upstream | Historical | — | #1758 | Merged upstream; fork main fast-forwarded to `09ae3c22`; retired `fix/mai-cost-table-provider-section` is no longer the MAI branch |
| GSD-W012 | Pre-fork model routing snapshot | Fork-local | No PR planned | — | — | Superseded recovery branch; extract only proven missing MAI tests |
| GSD-W016 | Recovery artifact for GSD-W014 Phase I/J economics and routing spike | Fork-local | No PR planned | — | — | Commit `e8e46fe9450f326641fccf7bbf3929f10be80f09` archived on `recovery/github-copilot-catalog-phase-i-j-e8e46fe9` (pushed to origin, same SHA); provenance for GSD-W014 Phase I/J, not directly mergeable, reconstruct hunk-by-hunk later |

## Important commit references

- `409ea8543bc6807b17b49317c117e8c846b1d1bf` — merged Sonnet 5 catalog and recon routing work.
- `42cb8ec346e06cd41b51c69acccb9e91d3a9290f` — merged Sonnet 5 capability, cost, and profile registry work.
- `795b4b3df76ca15f91834e6d11c749c179d8ce18` — merged Copilot Sonnet fallback.
- `8b986a9b2953ee56467194bb9b2fa62d2246542e` — bootstrap recovery follow-up on PR #1706.
- `788ef30621f06e951a9d866dc049c9eb2545b6d6` — preserved pre-fork recovery snapshot.
- `47461c6065b116e1320bf7aeef912af8bc77a017`, `babffb04251d04a70f03ab1cafbe2cb6cb3f8c75`, and `c4f785534924f55eb644c451e8668969a875ab1c` — MAI Code 1.1 Flash upstream PR #1758 commits (merged).
- `28dd2521`, `935c5b2b`, `5e204ae7`, `a69d39d7`, `f0992fcd`, `3cc035f53b10bf437d3e20dc1e058177c98ca90e` — GSD-W014 Copilot model-catalog sync on `feat/github-copilot-model-catalog-sync`; the final Phase-H fix was `fix(gsd): align overlay-writer test typing with dynamic model ids`. The fixed branch is committed and pushed, and remote sharded verification run `32129093671` concluded success: build + lifecycle gate + 4 shards all green. The broader Phase I/J economics and routing spike remains archived under GSD-W016 and is not directly mergeable.
- `4bdb8909bfb6cbb4d137cb178137a37f2b91abf4` — GSD-W014 Phase K narrow local-first `/models why` fix (auth/network-safety half only); remote proof `32199524656` only exercised the non-sharded stable verify workflow and is retained as **superseded preliminary evidence**.
- `26ae1e55d972781db4dbaf475f566fe3d746affe` — GSD-W014 Phase K completion commit `fix(gsd): complete Copilot model explanation contract`, fast-forwarded onto `feat/github-copilot-model-catalog-sync` (`4bdb8909..26ae1e55`). Replaces the buggy `startsWith("why")` parser with a strict first-token match, removes the default-model fallback, and adds the full structured explanation (effective-local, session-available, last-known live-catalog status, capability tier, profile confidence, economics summary/source/freshness with no synthetic placeholders, automatic-routing eligibility, reason, guidance) plus catalog completions/help text for `why <model>` and 22 new execution-based tests. Verified via **sharded** remote run `32203423874` (`pimmink/gsd-pi-ci`, workflow `remote-pr-verification-sharded.yml`): all 7 jobs green (build, lifecycle shadow gate, test-shard 1/4–4/4), conclusion `success`.
- `3f1bcf0f79a27a6a25f40c6407aa1c153b91c474` — GSD-W014 rebased completion on top of upstream/main `281abbce` (1.16.0): rich live Copilot `/models` normalization with provider-static fallbacks and per-field provenance, account-isolated last-known-good snapshots with suspicious-shrink rejection, safe remote-only model registration/quarantine, provider-aware economics/provenance/promotions, fail-closed routing for unknown-confidence models, and the expanded `sync`/`changes`/`pricing`/`promos`/`doctor`/strict `why` command surface plus docs/help/completions. Verified by **sharded** exact-SHA remote run `32242571833` (workflow `Remote PR verification (gsd-pi) - sharded`): all 7 jobs green and aggregate totals `14369` passed / `0` failed / `31` skipped. Local proof on the same SHA: broadened W014 execution suites `247/247`, `typecheck:extensions`, `verify:fast`, and `git diff --check` all green. No overlapping upstream issue or PR was found; local issue/PR drafts were prepared, but no GitHub write was performed without explicit authorization.
- `a381d55`, `3667f8d`, `87648c0` (in `pimmink/gsd-pi-ci`, not this repo) — GSD-W015 sharded remote pr-verification harness; two real dispatches, exact pass/fail/skip match to the unsharded baseline, ~37% wall-clock reduction.
- `e8e46fe9450f326641fccf7bbf3929f10be80f09` — GSD-W016 recovery artifact for GSD-W014 Phase I/J (provider-aware Copilot economics and router profile-confidence safety), archived on `recovery/github-copilot-catalog-phase-i-j-e8e46fe9`; built on the retired `fix/mai-cost-table-provider-section` base, not directly mergeable, do not cherry-pick wholesale.
- `1dc21a2026a80241961a5cc408e322088f48ba98` through `6ea9ffe9d8ffb95074acf711365b7066a043763a` — fork-native VS Code/Copilot profile governance and init prompt.

## Register maintenance

For every status change:

1. Confirm current GitHub state through GitHub MCP or a bounded `gh` read.
2. Confirm local and remote branch heads through Git.
3. Update `work-register.json` first.
4. Update this projection in the same commit.
5. Include validation evidence and one concrete next action.

Do not remove closed or superseded entries. They explain why branches and commits exist and
prevent repeated work.
