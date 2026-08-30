<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-08-28**.

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

**2026-08-28**: maintainer `jeremymcs` commented on PR #1978 that it now conflicts with
[#2035](https://github.com/open-gsd/gsd-pi/pull/2035) (merged upstream), which landed a
dotted-aware `canonicalModelId` normalization in the model router touching
`auto-model-selection.ts`. All three branches (GSD-W014, GSD-W018, GSD-W017) have since
been rebased onto the post-#2035 upstream/main tip, fixed for the same dotted-ID root
cause in their own files (a `bareModelId()` helper had been silently reintroduced by an
auto-merge, plus several direct registry lookups across all three branches keyed on raw
dotted IDs instead of `canonicalizeModelId`), fully re-verified, and force-pushed.

**2026-08-30**: opened upstream issue [#2088](https://github.com/open-gsd/gsd-pi/issues/2088)
for post-merge GitHub Copilot catalog regressions. GSD-W029 through GSD-W031 track the
dependent normalization, account-scoped runtime activation, and safe-suggestion fixes;
they preserve GSD-W014, GSD-W017, and GSD-W018 as merged historical work.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Complete | Maintain profile/templates/register from governance anchor; keep feature worktrees clean |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |
| GSD-W021 | Repair evidence-backed lifecycle shadow authority before Milestone validation | Upstream | PR required | [#2055](https://github.com/open-gsd/gsd-pi/issues/2055) | [#2002](https://github.com/open-gsd/gsd-pi/pull/2002) | `fix/lifecycle-shadow-authority-repair` | **PR open / Review fixes pushed & CI green** — Rebased onto `upstream/main`, unified single-step repair batch, enforced exact `passed` token, fixed test FK fixture (`647c4a07`). Linked issue #2055. Full GitHub Actions CI run passed 100% green. | Await maintainer review/merge on PR #2002 |
| GSD-W022 | Agent-core resolved tool result `isError` dropped in the agent loop | Upstream | PR required | [#2015](https://github.com/open-gsd/gsd-pi/issues/2015) | [#2016](https://github.com/open-gsd/gsd-pi/pull/2016) | `fix/agent-core-tool-result-iserror` | **Draft PR open / Implementation pushed** — `5bfcc551` pushed to PR #2016. AgentToolResult gains optional `isError?: boolean` field, `normalizeAgentToolResult` and `raceToolExecutionAgainstAbort` preserve `isError`. All 29 tests pass (100%). Installed local community extension patch `w022-iserror-patch` at `~/.gsd/agent/extensions/` using `tool_result` hook so `/gsd auto` in Edelman Studio preserves `isError` immediately | Await GitHub CI and maintainer decision on RFC issue #2015 / Draft PR #2016; local patch active in `~/.gsd/agent/extensions/` for local execution |
| GSD-W023 | Recovery runtime patch tracking (orphan guard, upstream PR #1946) | Fork-local | No PR planned | — | [#1946](https://github.com/open-gsd/gsd-pi/pull/1946) | `track/recovery-runtime-patch-1946` | **Complete** — PR #1946 is merged and included in release `v1.16.2` (published 2026-08-25); global CLI upgraded from `1.16.1` to `1.16.2` and verified in a fresh process; no independent W023 runtime patch remains. The unrelated Copilot catalog patch was retired upon v1.17.0 release | None for W023 |
| GSD-W024 | UAT issue #1993 follow-up (schema-error poisoning / stale abort) | Upstream | PR required | [#1993](https://github.com/open-gsd/gsd-pi/issues/1993) | [#2017](https://github.com/open-gsd/gsd-pi/pull/2017) | `fix/uat-1993-schema-error-poisoning` | **Draft PR open** — `d351e4bc`; focused W024 suites 110/110 green. Schema-invalid `gsd_uat_exec` no longer poisons the run; stale `tool-error` aborts clear only after successful execution; real truncation guards remain. Issue #1993 is labeled `needs-maintainer-review`/`large-scope` | Await maintainer review on #2017; keep Draft until broader scope and invariants are accepted, then run broader verification and mark ready |
| GSD-W029 | Truthful GitHub Copilot catalog normalization and bounded diagnostics | Upstream | PR required | [#2088](https://github.com/open-gsd/gsd-pi/issues/2088) | — | `fix/copilot-catalog-truthful-normalization` | Investigating — post-merge regression correction for provider facts, catalog role, picker visibility, manual selection, routing status, placeholder rejection, and bounded diagnostics | Reproduce on current upstream/main, then create the clean branch |
| GSD-W030 | Account-scoped GitHub Copilot runtime catalog activation | Upstream | PR required | [#2088](https://github.com/open-gsd/gsd-pi/issues/2088) | — | `fix/copilot-runtime-catalog-activation` | Investigating — dependent correction for refresh classifications becoming account-scoped registry and picker models without static or user-catalog mutation | Begin after W029 establishes normalized catalog facts |
| GSD-W031 | Safe account-scoped GitHub Copilot model suggestions | Upstream | PR required | [#2088](https://github.com/open-gsd/gsd-pi/issues/2088) | — | `fix/copilot-suggestion-safety` | Investigating — dependent correction for selection origin, deterministic capability dominance, and comparable account-scoped economics | Begin after W030 activates runtime models |

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
| GSD-W014 | GitHub Copilot model-catalog sync (`/gsd copilot-models`) | Upstream | Historical | — | #1978 | Merged in `4b26a642` (released in v1.17.0) |
| GSD-W016 | Recovery artifact for GSD-W014 Phase I/J economics and routing spike | Fork-local | No PR planned | — | — | Commit `e8e46fe9450f326641fccf7bbf3929f10be80f09` archived on `recovery/github-copilot-catalog-phase-i-j-e8e46fe9` (pushed to origin, same SHA); provenance for GSD-W014 Phase I/J, not directly mergeable |
| GSD-W017 | Cheaper same-tier Copilot suggestions in `pricing`/`why`, plus proactive notifications | Upstream | Historical | — | #1980 | Merged in `31fab790` (released in v1.17.0) |
| GSD-W018 | Session-start GitHub Copilot catalog refresh and runtime model activation | Upstream | Historical | — | #1979 | Merged in `40553f41` (released in v1.17.0) |
| GSD-W019 | `verify-merge` heavy-gate classifier and compile-once optimization | Upstream | Historical | — | #1990 | Merged in `31094b0f` (released in v1.17.0) |
| GSD-W020 | Repo-wide markdownlint config: disable MD013/MD060 | Upstream | Historical | #1992 | #1991 | Merged in `a1b55909` (released in v1.17.0) |
| GSD-W025 | Verify multilingual verify-command fixtures | Upstream | Historical | #1994 | — | Dropped — out of scope for this fork (external issue #1994 by @efrembaraldo; won't implement) |
| GSD-W026 | UAT contract: canonical `nonAutomatable` flag | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W027 | Mixed milestone validation/schema: class-pass under aggregate needs-attention | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W028 | Stale local path cleanup in docs and settings | Fork-local | No PR planned | — | — | Complete — `~/.gsd/agent/settings.json` points to `/Users/pimmink/Klanten/gsd-pi-pimmink/fork` |

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
| `copilot-catalog-patch` | `~/.gsd/agent/extensions/copilot-catalog-patch` | GSD-W014, GSD-W017, GSD-W018 | **Retired & deleted** (2026-08-29) | Yes | Retired upon release of `@opengsd/gsd-pi@1.17.0` (all 3 underlying PRs #1978, #1979, #1980 merged upstream and natively supported in GSD core). |
| `w022-iserror-patch` | `~/.gsd/agent/extensions/w022-iserror-patch` | GSD-W022 (PR #2016) | **Active** | Yes | Preserves `isError` in `tool_result` event handlers during `/gsd auto` runs until PR #2016 merges. |

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
