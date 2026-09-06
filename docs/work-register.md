<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-09-06**.

- **Upstream / PR required**: intended for contribution to `open-gsd/gsd-pi`.
- **Fork-local / No PR planned**: tooling, recovery, or workflow used only by this fork;
  it must not be added to an upstream feature PR.
- **Historical**: completed or closed upstream work retained for traceability.
- **Local plans**: an optional `planRefs` array in a canonical item may name stable `PLAN-*`
  identifiers from the workspace-root `plans/` memory. Plans preserve original ideas and are not
  authoritative status or validation evidence; local paths never enter the public register.

**2026-08-24 worktree audit**: re-checked PR #1978/#1979/#1980 — all still `OPEN` (no
merges), no register changes needed for them. Removed two dead local worktrees/branches
with nothing at risk: `dsstore-fixture` (`fix/update-model-catalog-workflow-ds-store`, zero
unique commits, never pushed) and `governance-finalization`
(`docs/copilot-workspace-governance-finalization`, never pushed, tip commit already an
ancestor of this branch's current HEAD — fully superseded). Found one real, previously
untracked worktree with a pushed commit and no PR — added as GSD-W019 below instead of
removing it.

**2026-08-28**: maintainer `jeremymcs` commented on PR #1978 that it now conflicts with
[#2035](https://github.com/open-gsd/gsd-pi/pull/2035) (merged upstream), which landed a
dotted-aware `canonicalModelId` normalization in the model router touching
`auto-model-selection.ts`. The related local branches (GSD-W014, GSD-W018, GSD-W017) were
rebased onto the post-#2035 upstream/main tip and re-verified during that review cycle, but
only GSD-W014 ultimately merged; GSD-W017 and GSD-W018 are retained as closed-unmerged
historical proposals.

**2026-08-30**: opened upstream issue [#2088](https://github.com/open-gsd/gsd-pi/issues/2088)
for post-merge GitHub Copilot catalog regressions. GSD-W029 through GSD-W031 track the
dependent normalization, account-scoped runtime activation, and safe-suggestion fixes;
they preserve GSD-W014 as merged historical work and supersede or replace parts of the
closed-unmerged GSD-W017/GSD-W018 proposals where applicable.

**2026-08-30 merged-worktree cleanup**: removed clean local worktrees and local branch
refs for completed historical work after checking upstream ancestry. Later v1.18 cleanup
removed the remaining local Copilot catalog/model-stack worktrees whose PRs were merged,
closed-unmerged, or superseded.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Local Phase-A contract complete — commit `a4175ffa` records snapshots, broader rebase detection, review-thread classification, agents, and read-only routing; 11 direct fixtures pass. Actual GitHub rendering and remote publication remain external checks. | Maintain the profile templates and use the read-only snapshot at authorized publication checkpoints |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |
| GSD-W022 | Agent-core resolved tool result `isError` dropped in the agent loop | Upstream | PR required | [#2015](https://github.com/open-gsd/gsd-pi/issues/2015) | [#2016](https://github.com/open-gsd/gsd-pi/pull/2016) | `fix/agent-core-tool-result-iserror` | **PR open / Ready for review** — `01332005` pushed to PR #2016 after rebase on `upstream/main`. AgentToolResult gains optional `isError?: boolean` field, `normalizeAgentToolResult` and `raceToolExecutionAgainstAbort` preserve `isError`, and awaited promise is captured once. All 30 tests in `agent-loop.test.ts` pass and `verify:fast` passed. PR title/description updated to fix; review comments addressed | Await maintainer review and merge on PR #2016; local patch active in `~/.gsd/agent/extensions/` for local execution |
| GSD-W023 | Recovery runtime patch tracking (orphan guard, upstream PR #1946) | Fork-local | No PR planned | — | [#1946](https://github.com/open-gsd/gsd-pi/pull/1946) | `track/recovery-runtime-patch-1946` | **Complete** — PR #1946 is merged and included in release `v1.16.2` (published 2026-08-25); global CLI upgraded from `1.16.1` to `1.16.2` and verified in a fresh process; no independent W023 runtime patch remains. The unrelated Copilot catalog patch was retired upon v1.17.0 release | None for W023 |
| GSD-W024 | UAT issue #1993 follow-up (schema-error poisoning / stale abort) | Upstream | PR required | [#1993](https://github.com/open-gsd/gsd-pi/issues/1993) | [#2017](https://github.com/open-gsd/gsd-pi/pull/2017) | `fix/uat-1993-schema-error-poisoning` | **PR open / Ready for review** — `73f14476` rebased onto `upstream/main`; register-hooks-loop-guard-auto tests pass 17/17 (including timeout-heal, cross-tool-heal, and atomic turn-abort protection tests); `verify:fast` green. Description updated with explicit Option 1 invariants; atomic `withRecordLock` conditional clear implemented; draft status removed | Await maintainer review and merge on PR #2017 |
| GSD-W030 | Account-scoped GitHub Copilot runtime catalog activation | Upstream | PR required | [#2088](https://github.com/open-gsd/gsd-pi/issues/2088) | — | `fix/copilot-runtime-catalog-activation` | Blocked — refresh classifications and bounded join are dead relative to the registry/picker; the only registry extension seam requires unsafe provider replacement and fabricated concrete fields | Open the focused RFC from `docs/adr/w030-account-scoped-copilot-runtime-catalog-rfc-draft.md` and obtain approval before implementation |
| GSD-W033 | DB-authoritative GSD project progress in the VS Code sidebar | Upstream | PR required | [#2136](https://github.com/open-gsd/gsd-pi/issues/2136) | [#2143](https://github.com/open-gsd/gsd-pi/pull/2143) | `feat/vscode-project-progress` | **Merged** — PR #2143 was merged by `jeremymcs`; upstream/main contains merge commit `8e0a639a` with PR head `bf0067cf`. The final implementation keeps CLI/MCP progress compatibility, moves details to host-only RPC, propagates DB-open errors, bounds/indexes hierarchy, caches generic 10-second refreshes, and restores open sections. Prior focused DB/RPC 10/10, VS Code contracts 14/14, and clean-runner `33957899813` were green on exact SHA `69e3d75c`. A local-only script diff was preserved separately and is not W033 scope. | None for W033 implementation; later remove/archive the obsolete local worktree after preserving any remaining local-only evidence. |
| GSD-W034 | Phase D1 timing evidence and shard strategy decision | Fork-local | No PR planned | — | — | `chore/remote-verify-triage` | **Measurement complete; decision: greedy not approved** — commit `cc6ef4b` adds the harness self-check; comparable runs `33971239244`, `33976665364`, and `33977584296` are green with `14781 passed, 0 failed, 31 skipped`; each validates 1327 timing records with identical manifest, Node, runner, and lockfile provenance. Slowest shard remained approximately 808s, 787s, and 814s; no greedy A/B result proves the required >=10% improvement. | Keep contiguous as default and fallback; reopen only for a separately authorized greedy A/B experiment. |
| GSD-W035 | Project snapshot must not reuse another project's open DB handle | Upstream | PR required | [#2102](https://github.com/open-gsd/gsd-pi/issues/2102) | [#2172](https://github.com/open-gsd/gsd-pi/pull/2172) | `fix/project-snapshot-db-handle` | **PR open / checks green** — follow-up to merged #2170 after stacked #2171 was closed unmerged. Rebased onto `main` at `f0c4ac525` after merged #2175 and reconciled both fixes. Current head `31b77759c` preserves requested DB path validation, global-handle restoration, canonical read-root opening, read-only queue-order behavior, and error parity. Combined affected suite: 117/117; extension typecheck and all three package builds pass; all GitHub checks pass. | Await maintainer review and merge on PR #2172; verify the isolation fix is present in `main` after merge. |
| GSD-W036 | Optional sharded pre-review verification workflow proposal | Upstream | PR required | [#2176](https://github.com/open-gsd/gsd-pi/issues/2176) | [#2177](https://github.com/open-gsd/gsd-pi/pull/2177) | `docs/sharded-pre-review-ci-proposal` | **Draft PR open / review-only** — shares the contributor-developed sharded clean-runner method for maintainer review. Includes concrete review files: workflow `.github/workflows/pre-review-verification-sharded.yml`, helper `scripts/pre-review-verify.sh`, and docs. `fa3873d6` switched to approved Blacksmith runners; `0c88e7d2` added targeted shellcheck annotations; `d23ee841` clarifies richer watch/resume/logs/triage/timing/fallback pieces are intentionally omitted from the first upstream draft; `f1f963cd` links the existing public harness components and purposes. Not merge-parity, not an upstream CI replacement, and cost claims remain conservative. | Await maintainer response; keep #2177 as clarification/review-only until maintainers request implementation. |

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
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | Historical | — | #1978 | Merged in `4b26a642` (released in v1.17.0); local catalog worktree removed during v1.18 cleanup |
| GSD-W016 | Recovery artifact for GSD-W014 Phase I/J economics and routing spike | Fork-local | No PR planned | — | — | Commit `e8e46fe9450f326641fccf7bbf3929f10be80f09` archived on `recovery/github-copilot-catalog-phase-i-j-e8e46fe9` (pushed to origin, same SHA); provenance for GSD-W014 Phase I/J, not directly mergeable |
| GSD-W017 | Cheaper same-tier Copilot suggestions in `pricing`/`why`, plus proactive notifications | Upstream | Historical | — | #1980 | Closed unmerged; local proposal retained as historical context only |
| GSD-W018 | Session-start GitHub Copilot catalog refresh and runtime model activation | Upstream | Historical | — | #1979 | Closed unmerged; activation work remains tracked separately under GSD-W030 |
| GSD-W029 | Truthful GitHub Copilot catalog normalization and bounded diagnostics | Upstream | PR required | #2088 | #2092 | Merged upstream; local worktree removed during v1.18 cleanup |
| GSD-W031 | Safe account-scoped GitHub Copilot model suggestions | Upstream | PR required | #2088 | #2093 | Merged upstream; local worktree removed during v1.18 cleanup |
| GSD-W032 | Route bundled Copilot Kimi, Gemini 3.x, Grok 4.6, MAI Flash Picker, and GPT-5.4 Nano models | Upstream | PR required | #2132 | #2133 | Merged upstream; local worktree removed during v1.18 cleanup |
| GSD-W019 | `verify-merge` heavy-gate classifier and compile-once optimization | Upstream | Historical | — | #1990 | Merged in `31094b0f` (released in v1.17.0) |
| GSD-W020 | Repo-wide markdownlint config: disable MD013/MD060 | Upstream | Historical | #1992 | #1991 | Merged in `a1b55909` (released in v1.17.0) |
| GSD-W021 | Repair evidence-backed lifecycle shadow authority before Milestone validation | Upstream | PR required | #2055 | #2002 | Merged upstream on 2026-08-29; no active lifecycle-shadow-authority worktree remains |
| GSD-W025 | Verify multilingual verify-command fixtures | Upstream | Historical | #1994 | — | Dropped — out of scope for this fork (external issue #1994 by @efrembaraldo; won't implement) |
| GSD-W026 | UAT contract: canonical `nonAutomatable` flag | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W027 | Mixed milestone validation/schema: class-pass under aggregate needs-attention | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W028 | Stale local path cleanup in docs and settings | Fork-local | No PR planned | — | — | Complete — `~/.gsd/agent/settings.json` points to `current fork checkout` |

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

| Extension ID | Path | Related work | Status | Reimplementation | Notes |
| --- | --- | --- | --- | --- | --- |
| `copilot-catalog-patch` | `~/.gsd/agent/extensions/copilot-catalog-patch` | GSD-W014, GSD-W017, GSD-W018 | **Retired & deleted** (2026-08-29) | Yes | Retired after the local workaround was no longer needed; #1978 merged, while #1979/#1980 closed unmerged and must not be carried into the v1.18 fork update. |
| `w022-iserror-patch` | `~/.gsd/agent/extensions/w022-iserror-patch` | GSD-W022 (PR #2016) | **Active** | Yes | Preserves `isError` in `tool_result` event handlers during `/gsd auto` runs until PR #2016 merges. |

**Known gsd-pi issue (fixed in 1.16.1)**: on gsd-pi `<=1.16.0`, the documented global location
(`~/.gsd/agent/extensions/<id>/`, per `manifest-spec.md`/`building-extensions.md`) was
silently destroyed on every session start — `pruneRemovedBundledExtensions()` in
`src/resource-loader.ts` ran a "sweep" that `rmSync()`s (recursive, force) any subdirectory
under `~/.gsd/agent/extensions/` whose name isn't part of gsd's own currently-bundled
extension set, with no exclusion for `tier: "community"` manifests. Reproduced 2026-08-24 with
a trivial, harmless test extension — gsd silently deleted the whole directory after one
`gsd --print` session (no stderr). Temporarily worked around via a project-local
`.gsd/extensions/<name>.js` install in local workspace only. After upgrading the global install
from `1.16.0` to `1.16.1` (`npm install -g @opengsd/gsd-pi@latest`), re-ran the exact same
reproduction with a fresh dummy extension and it survived — **confirmed fixed**. Reverted to
the documented global location as the sole install and removed the project-local workaround.
`requires.platform` in the manifest is now `>=1.16.1` to self-document the minimum safe
version. Plausibly worth an upstream bug report/doc note someday for anyone still on
`<=1.16.0` (not filed — needs explicit authorization first).

**Retirement policy**: `copilot-catalog-patch` is retired and has no branch-head sync duty.
`w022-iserror-patch` remains active until PR #2016 merges and the active local runtime is
upgraded to a release containing the same behavior.

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
