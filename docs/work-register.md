<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-15**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W002 | Markdown renderer markdownlint compliance | Upstream | PR required | #1600 | #1610 | `fix/markdownlint-table-separators` | PR open, dirty/failing | Re-evaluate, then rebase/fix or close as superseded |
| GSD-W007 | Package-manager-aware verification and bootstrap recovery | Upstream | PR required | — | #1706 | `fix/verification-gate-package-manager` | PR open, dirty | Rebase, restore required CI, split bootstrap fix if requested |
| GSD-W008 | Canonical read DB isolation | Upstream | PR required | #1727 | #1731 | `fix/canonical-read-db-isolation` | PR open, clean/green | Await maintainer review |
| GSD-W009 | Canonical SQL predicates before LIMIT | Upstream | PR required | #1728 | #1732 | `fix/canonical-sql-predicates` | PR open, build failing | Fix build and ci-gate, then await review |
| GSD-W010 | Native/MCP canonical read error parity | Upstream | PR required | #1729 | #1734 | `fix/canonical-read-error-parity` | PR open, clean/green | Await maintainer review |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W014 | Live GitHub Copilot model-catalog check (`/gsd copilot-models`) | Upstream | PR required | — | — | `fix/mai-cost-table-provider-section` | In progress, remote-CI verified clean | Move to a clean `upstream/main`-based branch (one concern per PR); confirm whether an issue is required before opening a PR |

## Completed or historical work

| ID | Work | Scope | Upstream | Issues | PRs | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| GSD-W001 | Extension registry lockSync ESYNC | Upstream | Historical | #1598 | — | Issue closed; regression no longer active |
| GSD-W003 | Milestone status dependency visibility | Upstream | Historical | #1601 | — | Issue closed; `dependsOn` is exposed by the status tool |
| GSD-W004 | Legacy migration slice/decision consistency | Upstream | Historical | #1606, #1607 | #1611 | Merged in `8d1d2067b1ec5b0b06e8772033b6f6f848b7613d` |
| GSD-W005 | Canonical requirement/decision read tools | Upstream | Historical | #1608 | #1613, #1682 | Closed unmerged; active correctness follow-ups are GSD-W008 through GSD-W010 |
| GSD-W006 | Sonnet 5 routing and Copilot fallback | Upstream | Historical | #1612 | #1609, #1703, #1705 | All three PRs merged upstream |
| GSD-W011 | MAI Code 1.1 Flash Copilot routing | Upstream | Historical | — | #1758 | Merged upstream; all CI checks green at head `c4f78553` |
| GSD-W012 | Pre-fork model routing snapshot | Fork-local | No PR planned | — | — | Superseded recovery branch; extract only proven missing MAI tests |

## Important commit references

- `409ea8543bc6807b17b49317c117e8c846b1d1bf` — merged Sonnet 5 catalog and recon routing work.
- `42cb8ec346e06cd41b51c69acccb9e91d3a9290f` — merged Sonnet 5 capability, cost, and profile registry work.
- `795b4b3df76ca15f91834e6d11c749c179d8ce18` — merged Copilot Sonnet fallback.
- `8b986a9b2953ee56467194bb9b2fa62d2246542e` — bootstrap recovery follow-up on PR #1706.
- `788ef30621f06e951a9d866dc049c9eb2545b6d6` — preserved pre-fork recovery snapshot.
- `47461c6065b116e1320bf7aeef912af8bc77a017`, `babffb04251d04a70f03ab1cafbe2cb6cb3f8c75`, and `c4f785534924f55eb644c451e8668969a875ab1c` — MAI Code 1.1 Flash upstream PR #1758 commits (merged).
- `28a2c92c3835e61f5fd19beffc6b8b4c6476bfc6` — GSD-W014 Copilot model-catalog check, committed on the same branch as GSD-W011 and still needing a clean single-concern branch before any PR.
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
