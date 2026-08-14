<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-14**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W002 | Markdown renderer markdownlint compliance | Upstream | PR required | #1600 | #1610 | `fix/markdownlint-table-separators` | PR open | Refresh checks and determine whether current renderer changes supersede it |
| GSD-W007 | Package-manager-aware verification and bootstrap recovery | Upstream | PR required | — | #1706 | `fix/verification-gate-package-manager` | PR open | Resolve CI and maintainer feedback; split bootstrap fix if requested |
| GSD-W008 | Canonical read DB isolation | Upstream | PR required | #1727 | #1731 | `fix/canonical-read-db-isolation` | PR open | Resolve checks and review independently |
| GSD-W009 | Canonical SQL predicates before LIMIT | Upstream | PR required | #1728 | #1732 | `fix/canonical-sql-predicates` | PR open | Resolve checks and review independently |
| GSD-W010 | Native/MCP canonical read error parity | Upstream | PR required | #1729 | #1734 | `fix/canonical-read-error-parity` | PR open | Resolve checks while preserving shared error semantics |
| GSD-W011 | MAI Code 1.1 Flash Copilot routing | Upstream | PR required | — | — | `feat/mai-code-1-1-flash-copilot` | In progress | Finish provider/catalog tests, then prepare issue and PR |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | In progress | Commit locally, record commit, then decide fork-only versus upstream-safe split |

## Completed or historical work

| ID | Work | Scope | Upstream | Issues | PRs | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| GSD-W001 | Extension registry lockSync ESYNC | Upstream | Historical | #1598 | — | Issue closed; regression no longer active |
| GSD-W003 | Milestone status dependency visibility | Upstream | Historical | #1601 | — | Issue closed; `dependsOn` is exposed by the status tool |
| GSD-W004 | Legacy migration slice/decision consistency | Upstream | Historical | #1606, #1607 | #1611 | Merged in `8d1d2067b1ec5b0b06e8772033b6f6f848b7613d` |
| GSD-W005 | Canonical requirement/decision read tools | Upstream | Historical | #1608 | #1613, #1682 | Closed unmerged; active correctness follow-ups are GSD-W008 through GSD-W010 |
| GSD-W006 | Sonnet 5 routing and Copilot fallback | Upstream | Historical | #1612 | #1609, #1703, #1705 | All three PRs merged upstream |
| GSD-W012 | Pre-fork model routing snapshot | Fork-local | No PR planned | — | — | Superseded recovery branch; extract only proven missing MAI tests |

## Important commit references

- `409ea8543bc6807b17b49317c117e8c846b1d1bf` — merged Sonnet 5 catalog and recon routing work.
- `42cb8ec346e06cd41b51c69acccb9e91d3a9290f` — merged Sonnet 5 capability, cost, and profile registry work.
- `795b4b3df76ca15f91834e6d11c749c179d8ce18` — merged Copilot Sonnet fallback.
- `8b986a9b2953ee56467194bb9b2fa62d2246542e` — bootstrap recovery follow-up on PR #1706.
- `788ef30621f06e951a9d866dc049c9eb2545b6d6` — preserved pre-fork recovery snapshot.
- `ef6ec9cd` and `5a96d62d` — MAI Code 1.1 Flash feature and review-fix commits.
- `1dc21a2026a80241961a5cc408e322088f48ba98` — fork-native VS Code/Copilot workspace governance.

## Register maintenance

For every status change:

1. Confirm current GitHub state through GitHub MCP or a bounded `gh` read.
2. Confirm local and remote branch heads through Git.
3. Update `work-register.json` first.
4. Update this projection in the same commit.
5. Include validation evidence and one concrete next action.

Do not remove closed or superseded entries. They explain why branches and commits exist and
prevent repeated work.
