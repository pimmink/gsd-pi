<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-18**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | PR required | — | — | `feat/github-copilot-model-catalog-sync` | In progress, NOT PR-ready — Phase H active; read-only slice stable; `--register` needs redesign. 35/35 targeted tests, `typecheck:extensions`, and `verify:fast` are working-tree evidence, not yet committed into `f0992fcd` | Commit Phase-H working tree and verify remotely; redesign registration tests-first; Phase I/J preserved on recovery branch (GSD-W016) for later hunk-by-hunk reconstruction; no issue step during implementation |
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
- `28dd2521`, `935c5b2b`, `5e204ae7`, `a69d39d7`, `f0992fcd` — GSD-W014 Copilot model-catalog check on `feat/github-copilot-model-catalog-sync`; corrected scope on 2026-08-18 keeps the full catalog-sync workstream intact. Read-only drift reporting is stable; `--register` remains part of the workstream but must be redesigned before PR because first-run registration and placeholder metadata semantics are unsafe. Previous focused validation: 32/32 targeted tests pass and `pnpm run typecheck:extensions` passes; rerun focused checks and `pnpm run verify:fast` after redesign.
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
