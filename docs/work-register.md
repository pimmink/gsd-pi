<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-26**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.

**2026-08-24 worktree audit**: re-checked PR #1978/#1979/#1980 — all still `OPEN` (no
merges), no register changes needed for them. Removed two dead local worktrees/branches
with nothing at risk: `dsstore-fixture` (`fix/update-model-catalog-workflow-ds-store`, zero
unique commits, never pushed) and `governance-finalization`
(`docs/copilot-workspace-governance-finalization`, never pushed, tip commit already an
ancestor of this branch's current HEAD — fully superseded). Found one real, previously
untracked worktree with a pushed commit and no PR — added as GSD-W019 below instead of
removing it.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | PR required | [#1978](https://github.com/open-gsd/gsd-pi/pull/1978) | — | `feat/github-copilot-model-catalog-sync` | Complete — rebased a fourth time to `9c84c780a13f0a1ac1036600601a8a3dbdd33002`; exact-SHA full-gate run `32663412416` came back fully GREEN. 2026-08-24: addressed all 14 GitHub Copilot automated-review findings (12 posted + 2 overview-only) in commit `cf4d2c13`, then two independent `codex review` passes caught 6 more real issues across 2 correction rounds (economics precedence, account-key collisions, an implicit cost fallback that kept applying internally, a routing fix overriding an explicit `tier_models` pin, and a genuine `models.json` override still losing to live pricing) — all fixed across commits `16baf772` and `1439c2d0`. `tsc --noEmit` clean; 283+ tests green across 9 files. Exact-SHA remote gate `32743896391` green for the intermediate `16baf772`. PR description + a PR comment updated with the full review/fix history. **PR #1978 updated, Ready for review.** 2026-08-24: fixed a batch of cosmetic markdownlint/biome findings (organize-imports, unused imports, non-null assertions, `as any` mocks, useless switch cases, string-concat-to-template-literal) across the doc file + 6 source/4 test files in commit `c6e108ea` (pushed, was `1439c2d0`) — no functional changes. `tsc --noEmit` clean; 215/215 tests green across the 5 affected files. No fresh remote full-gate dispatched for this cosmetic-only commit. | Downstream PRs #1979/#1980 rebased onto this new tip. Monitor PR #1978 for maintainer feedback. |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |
| GSD-W017 | Cheaper same-tier Copilot suggestions in `pricing`/`why`, plus proactive notifications | Upstream | PR required | [#1980](https://github.com/open-gsd/gsd-pi/pull/1980) | — | `feat/copilot-cheaper-model-suggestions` | Complete — rebased a fourth time to `da4f2b4422530d8cca69c7b4d4e33937810b3197` onto GSD-W018's fourth-rebase tip; `git range-diff` confirmed content-identical, `typecheck:extensions` green. Exact-SHA full-gate run `32670073187` came back fully GREEN. This is the submission-grade exact-SHA evidence. **PR #1980 opened as Draft, depends on #1978 and #1979.** 2026-08-24: rebased a fifth time onto GSD-W018's `91787bcd`; this one hit a real merge conflict in `copilot-models.ts` (8 hunks, resolved by combining GSD-W014's type-safety fixes with GSD-W017's new parameters), plus a silent (non-conflicting) signature-drift breakage caught only by `tsc`, plus 2 confirmed **pre-existing** test-fixture bugs (wrong cost units in `copilot-models-handler.test.ts`; missing cost data entirely in `copilot-catalog-notifications.test.ts`, verified against the pre-rebase `recovery/w017-pre-rebase5-20260824` backup) — all fixed in commit `2a936c03` (force-pushed, was `da4f2b44`). `tsc --noEmit` clean; 269/269 tests green across 9 files. No fresh remote full-gate dispatched, per explicit user direction. | Full 3-PR stack (#1978 -> #1979 -> #1980) is now consistent and green locally. Monitor PR #1980 for maintainer feedback. |
| GSD-W018 | Session-start GitHub Copilot catalog refresh and runtime model activation | Upstream | PR required | [#1979](https://github.com/open-gsd/gsd-pi/pull/1979) | — | `feat/copilot-catalog-session-refresh` | Complete — rebased a fourth time to `886c4b41c3db3cb244de4ea6215c9f0771230b1d` onto GSD-W014's fourth-rebase tip (a first `--onto` attempt used the wrong oldbase, caught immediately, fixed cleanly). `git range-diff` confirmed both commits content-identical, `typecheck:extensions` green. Exact-SHA full-gate run `32666347203` came back fully GREEN. This is the submission-grade exact-SHA evidence. **PR #1979 opened as Draft, depends on #1978.** 2026-08-24: rebased a fifth time onto GSD-W014's `c6e108ea` (clean, zero conflicts) and fixed `copilot-catalog-session-refresh.ts`'s own cross-provider price-bleed bug (same class as GSD-W014's codex-round-1 fix) by adding `disableImplicitFallback: true` to its `resolveModelEconomics` call, in commit `91787bcd` (force-pushed, was `886c4b41`). `tsc --noEmit` clean; 25/25 tests green. No new regression test added and no fresh remote full-gate dispatched, per explicit user direction that this mirrors an already-tested PR #1978 pattern. | PR #1980 (GSD-W017) rebased onto this new tip. Monitor PR #1979 for maintainer feedback. |
| GSD-W019 | `verify-merge` heavy-gate classifier and compile-once optimization | Upstream | PR required | — | [#1990](https://github.com/open-gsd/gsd-pi/pull/1990) | `perf/verify-merge-efficiency` | Complete — rebased 2026-08-24 onto upstream/main (`a64a26db`), resolving a real conflict with an unrelated upstream native-addon-build fix by combining both. Cross-AI reviewed (`codex review --commit` + an independent Claude Opus 4.6 subagent pass); fixed a missing-value guard and a dirty-working-tree warning. The first exact-SHA remote dispatch ([32727696891](https://github.com/pimmink/gsd-pi-ci/actions/runs/32727696891)) caught a REAL bug live: the classify step crashed with exit 128 on the harness's shallow checkout (`ci-classify-changes.sh`'s own `HEAD~1` fallback also failed). Fixed by making both scripts fail *safe* (default to the heavy path) instead of crashing; 12/12 tests pass locally. Redispatch [32728995515](https://github.com/pimmink/gsd-pi-ci/actions/runs/32728995515) came back fully GREEN (verify-pr 19m41s, verify-merge 33m36s). Two other real findings (pre-existing `build-web-if-stale.cjs`/`ci-classify-changes.sh` gaps) verified but deliberately left out of scope, noted in the PR description. **PR #1990 opened, Ready for review.** | Monitor PR #1990 for maintainer feedback |
| GSD-W020 | Repo-wide markdownlint config: disable MD013/MD060, track remaining cleanup | Upstream | PR required | [#1992](https://github.com/open-gsd/gsd-pi/issues/1992) | [#1991](https://github.com/open-gsd/gsd-pi/pull/1991) | `docs/markdownlint-config` | Complete — repo-wide scan (`git ls-files '*.md'` piped to `markdownlint-cli2`, 1145 tracked files) found 29,678 issues across 919 files; MD013 (line-length, 17,309) and MD060 (table-column-style, 5,916) never enforced in practice, account for 78% of the total. Added a root `.markdownlint-cli2.jsonc` disabling both, zero content changes. Verified empirically: re-scan after the config drops to 6,472 issues in 649 files. Remaining cleanup deliberately NOT bundled in (one-concern-per-PR); tracked separately in issue #1992 with a full by-rule breakdown. **PR #1991 opened, Ready for review.** | Monitor PR #1991 for maintainer feedback; issue #1992 tracks remaining incremental cleanup |
| GSD-W021 | Repair evidence-backed lifecycle shadow authority before Milestone validation | Upstream | PR required | — | [#2002](https://github.com/open-gsd/gsd-pi/pull/2002) | `fix/lifecycle-shadow-authority-repair` | PR open — `4fff9598` (3 commits above the original `bb75b2f9`, pushed). Post-review found two more stop-ship gaps, both fixed test-first: (1) exact-pass verification predicate (`e7cb339e`); (2) milestone repair partial-write atomicity, now all-or-nothing with single-step repairs batched into one shared Domain Operation (`4061bc41` repro + `4fff9598` fix). 71/71 focused tests, `tsc`, `build:core`, `ci-fast-gates.sh` (222/222), `gate:lifecycle-shadow-no-cutover` all passed locally. Remote full-gate CI dispatched: [run 32947426378](https://github.com/pimmink/gsd-pi-ci/actions/runs/32947426378); `verify-pr` passed, `verify-merge` still running at last check. | Await remote `verify-merge`, resolve independent strong-review findings, then compile the OUTCOME report |
| GSD-W022 | Agent-core resolved tool result `isError` dropped in the agent loop | Upstream | PR required | — | — | `fix/agent-core-tool-result-iserror` | Idea — local branch created from `upstream/main` (`327343af`); no code yet | Reproduce the isError:true→false wrap with a regression test; confirm architecture approval for an optional `AgentToolResult.isError` field before implementing |
| GSD-W023 | Recovery runtime patch tracking (orphan guard, upstream PR #1946) | Fork-local | No PR planned | — | [#1946](https://github.com/open-gsd/gsd-pi/pull/1946) | `track/recovery-runtime-patch-1946` | Idea — confirm release status of #1946 | If shipped, plan a normal upgrade; if not, interim patch plan with backups/hashes/rollback only, no runtime write without `Patch-local.` authorization |
| GSD-W024 | UAT issue #1993 follow-up (schema-error poisoning / stale abort) | Upstream | PR required | [#1993](https://github.com/open-gsd/gsd-pi/issues/1993) | — | `fix/uat-1993-schema-error-poisoning` | Idea — local branch created from `upstream/main` (`327343af`); no code yet | Build callgraph/testmatrix, write regression tests for poisoning + stale-abort, then implement |
| GSD-W025 | Verify issue #1994 follow-up (multilingual verify-command fixtures) | Upstream | PR required | [#1994](https://github.com/open-gsd/gsd-pi/issues/1994) | — | `fix/verify-1994-multilingual-fixtures` | Idea — local branch created from `upstream/main` (`327343af`); no code yet | Build NL/IT/non-Latin fixture matrix with execution-based tests, then implement |
| GSD-W026 | UAT contract: canonical `nonAutomatable` flag and pure preflight | Upstream | PR required | — | — | `feat/uat-contract-non-automatable` | Idea — local branch created from `upstream/main` (`327343af`); no code yet | Design verdict matrix, add canonical field, wire preflight through the real validator, add tests |
| GSD-W027 | Mixed milestone validation/schema: class-pass under aggregate needs-attention | Upstream | PR required | — | — | `fix/mixed-milestone-validation-schema` | Idea — local branch created from `upstream/main` (`327343af`); no code yet; needs its own architecture approval | Seek approval before any migration/trigger change; until then, analysis/tests/local draft only |
| GSD-W028 | Stale local path cleanup in docs and settings | Fork-local | No PR planned | — | — | `docs/stale-local-paths-cleanup` | Idea — local branch created from `upstream/main` (`327343af`); no code yet | Correct stale paths via dynamic discovery or one local config value; keep user paths out of upstream docs |

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

## Local extension patches (temporary, not part of any PR)

Human-readable projection of `work-register.json`'s `localExtensionPatches[]`. These are
personal, machine-local gsd-pi community extensions that reimplement not-yet-merged PR
behavior so the feature can be used day-to-day before the real PR ships. They are never
committed to any PR branch and are not upstream contributions in their own right.

| Extension ID | Path | Related work | Reimplementation | Retire when |
| --- | --- | --- | --- | --- |
| `copilot-catalog-patch` | `~/.gsd/agent/extensions/copilot-catalog-patch` (global — all projects, requires gsd-pi >=1.16.1) | GSD-W014, GSD-W017, GSD-W018 | Yes — scoped-down read-only reimplementation, not a copy of the PR diffs (community extensions cannot touch gsd's own core files those PRs modify: `model-router.ts`, `preferences-types.ts`, `bootstrap/register-hooks.ts`). Provides `/copilot-catalog [all\|pricing\|why]` and a best-effort hourly session-start change notification. Does **not** register fetched models as selectable/routable, and does **not** auto-suggest cheaper models on `before_model_select` — both were judged too risky to reimplement without the real PRs' tested logic. Verified working end-to-end 2026-08-24 from Edelman_Studio (live fetch of 56 Copilot models). | Delete once PR #1978, #1979, and #1980 have all merged and shipped in a released `@opengsd/gsd-pi` version |

**Known gsd-pi issue (fixed in 1.16.1)**: on gsd-pi `<=1.16.0`, the documented global location
(`~/.gsd/agent/extensions/<id>/`, per `manifest-spec.md`/`building-extensions.md`) was
silently destroyed on every session start — `pruneRemovedBundledExtensions()` in
`src/resource-loader.ts` ran a "sweep" that `rmSync()`s (recursive, force) any subdirectory
under `~/.gsd/agent/extensions/` whose name isn't part of gsd's own currently-bundled
extension set, with no exclusion for `tier: "community"` manifests. Reproduced 2026-08-24 with
a trivial, harmless test extension — gsd silently deleted the whole directory after one
`gsd --print` session (no stderr). Temporarily worked around via a project-local
`.gsd/extensions/<name>.js` install in Edelman_Studio only. After upgrading the global install
from `1.16.0` to `1.16.1` (`npm install -g @opengsd/gsd-pi@latest`), re-ran the exact same
reproduction with a fresh dummy extension and it survived — **confirmed fixed**. Reverted to
the documented global location as the sole install and removed the project-local workaround.
`requires.platform` in the manifest is now `>=1.16.1` to self-document the minimum safe
version. Plausibly worth an upstream bug report/doc note someday for anyone still on
`<=1.16.0` (not filed — needs explicit authorization first).

**Sync policy**: whenever `feat/github-copilot-model-catalog-sync`,
`feat/copilot-catalog-session-refresh`, or `feat/copilot-cheaper-model-suggestions` receive
new commits (review fixes, another rebase, anything), check whether
`~/.gsd/agent/extensions/copilot-catalog-patch/index.ts` needs a matching behavior update,
then update `branchHeadsAtLastSync` in `work-register.json` regardless — even a "no change
needed" review should bump the recorded SHA so drift never goes unnoticed.

Quick drift check (run from `worktrees/workspace-governance`, or any worktree with all three
branches fetched):

```sh
jq -r '.localExtensionPatches[] | .branchHeadsAtLastSync | to_entries[] | "\(.key) \(.value)"' \
  docs/work-register.json | while read -r branch expected; do
    actual=$(git rev-parse "$branch" 2>/dev/null || echo "MISSING")
    [ "$actual" = "$expected" ] && echo "OK    $branch" || echo "DRIFT $branch expected=$expected actual=$actual"
  done
```

## Register maintenance

For every status change:

1. Confirm current GitHub state through GitHub MCP or a bounded `gh` read.
2. Confirm local and remote branch heads through Git.
3. Update `work-register.json` first.
4. Update this projection in the same commit.
5. Include validation evidence and one concrete next action.
6. If the item has a `localExtensionPatchRef`, also run the drift check above and update
   `branchHeadsAtLastSync` for that patch in the same commit.

Do not remove closed or superseded entries. They explain why branches and commits exist and
prevent repeated work.
