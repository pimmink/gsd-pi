<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-23**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | PR required | — | — | `feat/github-copilot-model-catalog-sync` | Complete — rebased a third time to `4339e623c048f0289b717a38f9b01fa916358f44` (upstream/main advanced a 3rd time, `b5ff8ced`→`60f6919`); `git range-diff` confirmed all 18 commits content-identical, 209/209 tests and `typecheck:extensions` green. Exact-SHA full-gate run `32655349780` came back fully GREEN. This is the submission-grade exact-SHA evidence. | Local `.plans/` drafts refreshed to cite run `32655349780`; GSD-W018's own third-rebase full-gate now dispatched (run `32657264306`) |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |
| GSD-W017 | Cheaper same-tier Copilot suggestions in `pricing`/`why`, plus proactive notifications | Upstream | PR required | — | — | `feat/copilot-cheaper-model-suggestions` | In progress — rebased a third time to `bcc3946a28d9debf574a90b86f15d7872aa19101` onto GSD-W018's third-rebase tip; `git range-diff` confirmed content-identical, `typecheck:extensions` green. GSD-W014 and GSD-W018 both confirmed green on the third rebase; exact-SHA full-gate for this head now dispatched as run `32659104364` (pending). | Await run `32659104364`; if green, do one more upstream ancestry check, then write the final report |
| GSD-W018 | Session-start GitHub Copilot catalog refresh and runtime model activation | Upstream | PR required | — | — | `feat/copilot-catalog-session-refresh` | Complete — rebased a third time to `995518351238ddaf1b3d9273b51481b41ea74029` onto GSD-W014's third-rebase tip; `git range-diff` confirmed both commits content-identical, `typecheck:extensions` green. Exact-SHA full-gate run `32657264306` came back fully GREEN. This is the submission-grade exact-SHA evidence. | Local `.plans/` drafts refreshed to cite run `32657264306`; GSD-W017's own third-rebase full-gate now dispatched (run `32659104364`) |

## Completed or historical work

| ID | Work | Scope | Upstream | Issues | PRs | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| GSD-W001 | Extension registry lockSync ESYNC | Upstream | Historical | #1598 | — | Issue closed; regression no longer active |
| GSD-W002 | Markdown renderer markdownlint compliance | Upstream | Historical | #1600 | #1610 | Merged in `e7b6f291ac680f1b00fe1cb6ca246b8cbcac3aac` (2026-08-16) |
| GSD-W003 | Milestone status dependency visibility | Upstream | Historical | #1601 | — | Issue closed; `dependsOn` is exposed by the status tool |
| GSD-W004 | Legacy migration slice/decision consistency | Upstream | Historical | #1606, #1607 | #1611 | Merged in `8d1d2067b1ec5b0b06e8772033b6f6f848b7613d` |
| GSD-W005 | Canonical requirement/decision read tools | Upstream | Historical | #1608 | #1613, #1682 | Closed unmerged; active correctness follow-ups are GSD-W008 through GSD-W010 |
| GSD-W006 | Sonnet 5 routing and Copilot fallback | Upstream | Historical | #1612 | #1609, #1703, #1705 | All three PRs merged upstream |
| GSD-W007 | Package-manager-aware verification and bootstrap recovery | Upstream | Historical | — | #1706 | Merged in `85b334d4c0d77fe8c88ec5e000966f4ca8ba7092` (2026-08-16) |
| GSD-W008 | Canonical read DB isolation | Upstream | Historical | #1727 | #1731 | Merged in `10aa03954444e51390160f00a1d97a59d4a8604f` (2026-08-14) |
| GSD-W009 | Canonical SQL predicates before LIMIT | Upstream | Historical | #1728 | #1732 | Merged in `da908349835815274d2b2d097da50880d3c44f33` (2026-08-16) |
| GSD-W010 | Native/MCP canonical read error parity | Upstream | Historical | #1729 | #1734 | Merged in `e728a95714c7fa78cb2f41c91d978a93e6e56a5f` (2026-08-16) |
| GSD-W011 | MAI Code 1.1 Flash Copilot routing | Upstream | Historical | — | #1758 | Merged upstream; fork main fast-forwarded to `09ae3c22`; retired `fix/mai-cost-table-provider-section` is no longer the MAI branch |
| GSD-W012 | Pre-fork model routing snapshot | Fork-local | No PR planned | — | — | Superseded recovery branch; extract only proven missing MAI tests |
| GSD-W016 | Recovery artifact for GSD-W014 Phase I/J economics and routing spike | Fork-local | No PR planned | — | — | Commit `e8e46fe9450f326641fccf7bbf3929f10be80f09` archived on `recovery/github-copilot-catalog-phase-i-j-e8e46fe9` (pushed to origin, same SHA); provenance for GSD-W014 Phase I/J, not directly mergeable |

## Important commit references

- `7a81883a1187c07a3ce7dfd770caf2c520e7173b` — live W014 rebase onto current
  `upstream/main` `6a310619c187a3d940adc29e282c7d39246739b1`; local focused W014
  regression `209/209` and `typecheck:extensions` passed; fresh exact-SHA remote
  full-gate evidence is still pending.
- `6d0ccb73176841c927e5f16a34d73db0d97011f1` — historical W014 exact-SHA closeout
  on prior base `4bbfb31fa5f57bba8d977f4da2ee68ded56355ae`; remote full-gate
  `32309145810` proved literal `verify:pr` and `verify:merge`, now superseded by
  the newer rebase.
- `e8e46fe9450f326641fccf7bbf3929f10be80f09` — GSD-W016 recovery artifact for the
  stranded W014 Phase I/J economics and routing spike; provenance only, not
  directly mergeable.
- `a381d55`, `3667f8d`, `87648c0` — GSD-W015 sharded remote pr-verification
  harness in `pimmink/gsd-pi-ci`.
- `47461c6065b116e1320bf7aeef912af8bc77a017`,
  `babffb04251d04a70f03ab1cafbe2cb6cb3f8c75`, and
  `c4f785534924f55eb644c451e8668969a875ab1c` — MAI Code 1.1 Flash upstream PR
  #1758 commits (merged).
- `788ef30621f06e951a9d866dc049c9eb2545b6d6` — preserved pre-fork model-routing
  recovery snapshot tracked by GSD-W012.
- `1dc21a2026a80241961a5cc408e322088f48ba98` through
  `6ea9ffe9d8ffb95074acf711365b7066a043763a` — fork-native VS Code/Copilot
  governance workspace bootstrap and profile setup.

## Register maintenance

For every status change:

1. Confirm current GitHub state through GitHub MCP or a bounded `gh` read.
2. Confirm local and remote branch heads through Git.
3. Update `work-register.json` first.
4. Update this projection in the same commit.
5. Include validation evidence and one concrete next action.

Do not remove closed or superseded entries. They explain why branches and commits exist and
prevent repeated work.
