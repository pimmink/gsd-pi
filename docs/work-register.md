<!-- markdownlint-disable MD013 -->

# Contributor Work Register

Human-readable projection of [`work-register.json`](./work-register.json), which is the
canonical source. GitHub and local Git evidence was refreshed on **2026-10-07**.

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

**2026-10-07 catch-up registration**: registered the 2026-10-05 to 2026-10-07 patch batch
that quick/debug sessions had landed without register entries: GSD-W047 (`.d.ts` discovery,
PR #2641), GSD-W048 (write-EIO recovery, PR #2642), GSD-W049 (`await_job` truncated
follow-ups, PR #2643), GSD-W050 (`/gsd recover` punctuation, PR #2659), GSD-W051 (clearLock
orphaned Attempts, PR #2441), GSD-W052 (reopened-slice SUMMARY drift exemption, PR #2674),
fork-local GSD-W053 (runtime releases 1.21.1-fork.1/2), and GSD-W054 (MCP integration
Part 2 umbrella #2666 with children #2667-#2672). GSD-W036 gained review-hardening commit
`7bf0d8e5`. A same-day second pass (quick task 289) backfilled the older gap: GSD-W055
(PR #2098), GSD-W056 (closed-unmerged PR #2276), GSD-W057 (PR #2308), GSD-W058 (PR #2393),
GSD-W059 (PR #2407) and GSD-W060 (PR #2409), each with merge-containment evidence verified
against fetched upstream/main. The same pass audited the local runtime layers and found the
installed fork.2 package and managed resources were a patchwork of interim syncs; fork.3
(GSD-W053) realigns all layers with the reviewed branch versions. A third pass (quick task
290) triaged every unresolved Copilot review thread across the open PRs: six were already
addressed by later commits and were answered with evidence and resolved; #2674's
temporal-tie finding was valid and got a real fix (`a4ad88c6`) that also ships in fork.4.

## Active work

| ID | Work | Scope | Upstream | Issue | PR | Branch | Status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GSD-W013 | Fork-native VS Code and Copilot workspace | Fork-local | No PR planned | — | — | `docs/copilot-workspace-governance` | Local Phase-A contract complete — commit `a4175ffa` records snapshots, broader rebase detection, review-thread classification, agents, and read-only routing; 11 direct fixtures pass. Actual GitHub rendering and remote publication remain external checks. | Maintain the profile templates and use the read-only snapshot at authorized publication checkpoints |
| GSD-W015 | Sharded remote pr-verification harness (test-efficiency) | Fork-local (lives in `pimmink/gsd-pi-ci`, not this repo) | No PR planned | — | — | `perf/unit-test-sharding` (gsd-pi-ci) | Complete | None required; optional future promotion from experimental to primary |
| GSD-W022 | Agent-core resolved tool result `isError` dropped in the agent loop | Upstream | PR required | [#2015](https://github.com/open-gsd/gsd-pi/issues/2015) | [#2016](https://github.com/open-gsd/gsd-pi/pull/2016) | `fix/agent-core-tool-result-iserror` | **Merged** — PR #2016 merged upstream at `9212937f` and contained in v1.18.0. Verified at file level 2026-09-07: `isError: result?.isError ?? false` in `packages/pi-agent-core/src/agent-loop.ts` L1093/L1123, optional `isError?: boolean` in `types.ts` L77/L362. | None; worktree removed and the redundant `w022-iserror-patch` runtime extension retired. |
| GSD-W023 | Recovery runtime patch tracking (orphan guard, upstream PR #1946) | Fork-local | No PR planned | — | [#1946](https://github.com/open-gsd/gsd-pi/pull/1946) | `track/recovery-runtime-patch-1946` | **Complete** — PR #1946 is merged and included in release `v1.16.2` (published 2026-08-25); global CLI upgraded from `1.16.1` to `1.16.2` and verified in a fresh process; no independent W023 runtime patch remains. The unrelated Copilot catalog patch was retired upon v1.17.0 release | None for W023 |
| GSD-W024 | UAT issue #1993 follow-up (schema-error poisoning / stale abort) | Upstream | PR required | [#1993](https://github.com/open-gsd/gsd-pi/issues/1993) | [#2017](https://github.com/open-gsd/gsd-pi/pull/2017) | `fix/uat-1993-schema-error-poisoning` | **Merged** — PR #2017 merged upstream at `dcdf4fc9` and contained in v1.18.0. Verified at file level 2026-09-07: `isRetryableHarnessToolError` (register-hooks.ts L801) with `isToolSchemaValidationError` discrimination (L808), `isAbortedExecutionToolResult` (L795), `clearCurrentUnitToolErrorHarnessAbort` (L110, called L1934/L2146), turn-abort precedence in `unit-runtime.ts` L188. | None; worktree removed. |
| GSD-W030 | Account-scoped GitHub Copilot runtime catalog activation | Upstream | PR required | [#2088](https://github.com/open-gsd/gsd-pi/issues/2088) | — | `fix/copilot-runtime-catalog-activation` | **Closed unmerged** — RFC [#2091](https://github.com/open-gsd/gsd-pi/issues/2091) closed as `wontfix` 2026-08-30. Maintainer: the Class A/B/C safety goal is already met at write time (`copilot-models sync --register` only writes complete models), and `gsd update --models` plus the weekly catalog bot already cover catalog refresh. Local inspection 2026-09-07 found no activation implementation: the only commit `c2b0222fc` belongs to GSD-W029, and the dirty diff was ~70% formatter churn plus a pre-W031 regression. | None; narrow real bugs landed via #2092 (W029) and #2093 (W031). Worktree and patch removed; working state archived under `plans/patches/archive/2026-09-07-pre-cleanup/`. |
| GSD-W033 | DB-authoritative GSD project progress in the VS Code sidebar | Upstream | PR required | [#2136](https://github.com/open-gsd/gsd-pi/issues/2136) | [#2143](https://github.com/open-gsd/gsd-pi/pull/2143) | `feat/vscode-project-progress` | **Merged** — PR #2143 was merged by `jeremymcs`; upstream/main contains merge commit `8e0a639a` with PR head `bf0067cf`. The final implementation keeps CLI/MCP progress compatibility, moves details to host-only RPC, propagates DB-open errors, bounds/indexes hierarchy, caches generic 10-second refreshes, and restores open sections. The separate reduced snapshot contract is also merged through [#2170](https://github.com/open-gsd/gsd-pi/pull/2170). Prior focused DB/RPC 10/10, VS Code contracts 14/14, and clean-runner `33957899813` were green on exact SHA `69e3d75c`. A local-only script diff was preserved separately and is not W033 scope. | None for W033 implementation; later remove/archive the obsolete local worktree after preserving any remaining local-only evidence. |
| GSD-W034 | Phase D1 timing evidence and shard strategy decision | Fork-local | No PR planned | — | — | `chore/remote-verify-triage` | **Measurement complete; decision: greedy not approved** — commit `cc6ef4b` adds the harness self-check; comparable runs `33971239244`, `33976665364`, and `33977584296` are green with `14781 passed, 0 failed, 31 skipped`; each validates 1327 timing records with identical manifest, Node, runner, and lockfile provenance. Slowest shard remained approximately 808s, 787s, and 814s; no greedy A/B result proves the required >=10% improvement. | Keep contiguous as default and fallback; reopen only for a separately authorized greedy A/B experiment. |
| GSD-W035 | Project snapshot must not reuse another project's open DB handle | Upstream | PR required | [#2102](https://github.com/open-gsd/gsd-pi/issues/2102) | [#2172](https://github.com/open-gsd/gsd-pi/pull/2172) | `fix/project-snapshot-db-handle` | **Merged** — PR #2172 merged 2026-09-06T18:16:55Z at `59d5a358` and contained in v1.18.0. Verified at file level 2026-09-07: `isSameOpenDatabase` with realpath canonicalization (`state/derive/db-open.ts` L28/L33), `preserveGlobalDbHandle` with `finally` restore (`state/project-snapshot.ts` L79/L198/L220), `openedRequestedDb` authoritative (`progress-from-db.ts` L151), caller opt-in in `packages/mcp-server/src/workflow-tools.ts` L2967. No identifier named `projectRootForReads` exists. | None; worktree removed. |
| GSD-W036 | Optional sharded pre-review verification workflow proposal | Upstream | PR required | [#2176](https://github.com/open-gsd/gsd-pi/issues/2176) | [#2177](https://github.com/open-gsd/gsd-pi/pull/2177) | `docs/sharded-pre-review-ci-proposal` | **Ready for review** at `7bf0d8e5` — maintainer-approved scope applied: dispatch-only exact-SHA sharded unit-test tier, no duplicate lifecycle gate, shared Node/pnpm setup composite action, explicit arbitrary public source boundary, and existing upstream CI remains merge authority. 2026-10-05 commit `7bf0d8e5` closes the cache-poisoning and jq-injection review findings; PR verified open, non-draft, CLEAN with 10 passing checks on 2026-10-07. | Await maintainer review and CI on #2177. |
| GSD-W037 | VS Code Copilot read tools | Upstream | PR required | [#2099](https://github.com/open-gsd/gsd-pi/issues/2099) | [#2179](https://github.com/open-gsd/gsd-pi/pull/2179) | `docs/vscode-copilot-read-tools-plan`, `feat/vscode-copilot-read-tools` | **Ready for review** — PR #2179 was cleaned after #2172 merged and now contains only `503caa1f`, `32f045ba`, and hardening commit `523dcfe4` on current `main`. GitHub Copilot/Codex findings were addressed: undefined no-input invocation, `vscode.lm.registerTool` guard, active workspace root binding, and locked web-bridge read allowlisting; the outdated Copilot thread was resolved. Focused manifest/source test passes 8/8, diagnostics are clean, PR body records independent review/test evidence plus official docs references, and upstream CI is green except Windows portability skipped by policy. | Await maintainer review on PR #2179; address review feedback if requested. |
| GSD-W039 | Shared progress read metadata | Upstream | PR required | [#2099](https://github.com/open-gsd/gsd-pi/issues/2099) | [#2187](https://github.com/open-gsd/gsd-pi/pull/2187) | `feat/progress-read-metadata` | **Draft PR open** — commits `30ef769c`, `bd7dd5b6`, and `7ee883b5` add optional `readMetadata` provenance and preserve standalone MCP no-bridge fallback coverage. Focused local validation passed package builds plus progress/RPC/MCP/CLI/extension tests 111/111 after the final test fix; independent high review and targeted re-review found no blockers. #2099 was updated with comment `5566959938`, and the PR body records independent review/test evidence plus MCP/Copilot docs references. | Watch the restarted GitHub build for PR #2187 and address review or CI feedback. |

| GSD-W040 | Fresh-worktree focused tests fail on missing workspace dist artifacts | Upstream | PR required | [#2189](https://github.com/open-gsd/gsd-pi/issues/2189) | — | — | **Investigating** — opened from recurring contributor evidence where fresh worktrees first lack workspace links, then focused test resolvers can still follow package exports to missing `dist` artifacts. Sanitized examples include `tsc: command not found`, missing `@opengsd/rpc-client/dist/index.js`, missing `@opengsd/mcp-server/dist/readers/graph.js`, and earlier task evidence around `@opengsd/contracts/dist/index.js` / native `dist-test` subpaths. | Await maintainer triage; if accepted, plan a focused resolver/preflight fix. |

| GSD-W041 | Bugception version check misreads Markdown-formatted current version | Upstream | PR required | [#2191](https://github.com/open-gsd/gsd-pi/issues/2191) | — | — | **Investigating** — opened after #2189 received an automated upgrade prompt saying `GSD v\`1.18.0\`` was older than latest `v1.18.0`. Source inspection points to`.github/workflows/version-check.yml` stripping only a leading `v`, not Markdown backticks or other issue-template formatting. | Await maintainer triage; if accepted, normalize Markdown-formatted version field values before comparison. |
| GSD-W042 | Validate canonical evidence in the MCP host smoke probe | Upstream | PR required | [#2099](https://github.com/open-gsd/gsd-pi/issues/2099) | [#2273](https://github.com/open-gsd/gsd-pi/pull/2273) |`fix/mcp-host-smoke-validation` | **Merged** — PR #2273 merged 2026-09-12T21:55:29Z with head `94193db0`, matching the local worktree HEAD before cleanup and contained in fetched`upstream/main` at `0166eac49`. Earlier focused tests 6/6, MCP package build, packaged stdio smoke 5/5, and`verify:fast` passed with 267 tests. | None; contribution merged upstream and local worktree removed. |

| GSD-W038 | GPT-6 Astra support for GitHub Copilot | Upstream | PR required | [#2185](https://github.com/open-gsd/gsd-pi/issues/2185) | [#2186](https://github.com/open-gsd/gsd-pi/pull/2186) | `fix/copilot-gpt6-astra` | **Ready for review** — commit `38175fad5` adds generator fallback, generated Copilot catalog metadata, heavy-tier router/profile coverage, published pricing, and regression tests. Upstream AI Triage, fast-gates, build, node22-smoke, ci-gate, GitGuardian, and Socket checks are green; Windows portability is skipped by workflow policy. | Await maintainer review on PR #2186 |

| GSD-W046 | Align Copilot reasoning metadata, controls, and payloads | Upstream | PR required | [#2683](https://github.com/open-gsd/gsd-pi/issues/2683) | [#2684](https://github.com/open-gsd/gsd-pi/pull/2684) | `fix/copilot-reasoning-effort` | **PR open; review fix published** -- 2026-10-07: `06d0aa60` verified as PR/local head. Copilot finding fixed, replied to and thread verified resolved; no other threads. Red-before/green-after regression, 59 focused tests and strict focused TypeScript passed; no full local rebuild. [Current CI 37638581149](https://github.com/open-gsd/gsd-pi/actions/runs/37638581149) finished green (5 pass / 1 policy skip); PR BLOCKED only on pending maintainer review. Ships locally in fork release 1.21.1-fork.3 (GSD-W053), verified active in the managed runtime. | Await maintainer review on #2684. No merge/runtime patch or live backend acceptance claim. |
| GSD-W047 | Skip .d.ts declaration files in extension discovery | Upstream | PR required | [#2638](https://github.com/open-gsd/gsd-pi/issues/2638) | [#2641](https://github.com/open-gsd/gsd-pi/pull/2641) | `fix/extension-loader-skip-declaration-files` | **PR open** — head `a9ac081c` matches local tip and origin; mergeStateStatus CLEAN; checks 8 pass / 1 policy skip. Discovery stops logging spurious factory errors on declaration files; all three guards covered by new tests. Local runtime already carries the fix via fork 1.21.1-fork.2 (GSD-W053). | Await maintainer review on #2641. |
| GSD-W048 | Treat macOS write EIO as recoverable pipe-closed | Upstream | PR required | [#2639](https://github.com/open-gsd/gsd-pi/issues/2639) | [#2642](https://github.com/open-gsd/gsd-pi/pull/2642) | `fix/gsd-write-eio-recoverable` | **PR open** — startup follow-up `6ffebfd3` pushed; specialist review complete; integrated affected suites 69/69 pass. Detailed GFM body retains verification limits. | Monitor #2642; no duplicate concern. |
| GSD-W049 | await_job serves full output for truncated follow-ups | Upstream | PR required | [#2640](https://github.com/open-gsd/gsd-pi/issues/2640) | [#2643](https://github.com/open-gsd/gsd-pi/pull/2643) | `fix/async-jobs-await-truncated-output` | **PR open** — head `cd5427d2` matches local tip and origin; mergeStateStatus CLEAN; checks 8 pass / 1 policy skip. Recovered full output is exempt from display truncation; shipped locally via fork 1.21.1-fork.1 (GSD-W053). | Await maintainer review on #2643. |
| GSD-W050 | Strip trailing punctuation from pasted /gsd recover ids | Upstream | PR required | [#2658](https://github.com/open-gsd/gsd-pi/issues/2658) | [#2659](https://github.com/open-gsd/gsd-pi/pull/2659) | `fix/gsd-recover-trailing-punctuation` | **PR open** — head `14edd136` matches local tip and origin; mergeStateStatus CLEAN; checks 10 pass / 1 policy skip. | Await maintainer review on #2659. |
| GSD-W051 | Settle orphaned running Attempts in clearLock | Upstream | PR required | — | [#2441](https://github.com/open-gsd/gsd-pi/pull/2441) | `fix/clearlock-settle-orphaned-attempts` | **PR open** — head `34717a74` after 2026-10-06 review hardening (live-PID guard kept, every matching dead worker row cleaned); regression fails pre-fix and passes post-fix via stash bisection; crash-recovery suites 51/51. Checks 8 pass / 1 policy skip; CLEAN. Fixes the repeated auto-mode \"dispatch claim skipped: stale-lease\" wedge reproduced twice against a real project. | Await maintainer review on #2441. |
| GSD-W052 | Exempt reopened-slice orphaned SUMMARY artifacts from drift | Upstream | PR required | — | [#2674](https://github.com/open-gsd/gsd-pi/pull/2674) | `fix/slice-reopen-orphaned-summary-artifact` | **PR open; review fix published** — head `a4ad88c6`: the Copilot finding was valid (any historical reopen exempted later post-reopen rows), so the exemption is now tied temporally via `latestSliceReopenAt`; pre-reopen rows stay exempt, post-reopen writes with a missing file are flagged again. Regression case added; drift suite 73/73, strict tsc clean; thread answered and resolved. Ships locally in fork 1.21.1-fork.4 (GSD-W053). | Watch CI on `a4ad88c6`; await maintainer review on #2674. |
| GSD-W053 | Fork runtime releases 1.21.1-fork.1/2/3/4/5 ahead of npm 1.21.1, incl. cmux fix | Fork-local | No PR planned | — | — | `fix/write-eio-crash-storm`, `fix/integrate-cmux-and-upstream-fork5` | **In progress** — clean fork.5 candidate `9e32d10a` includes upstream and reviewed reliability fixes; combined compiled suites 69/69 pass. Old superseded full-unit runs interrupted, not PASS; C1 pending. | Complete C1 #2667, then final-source full gates and isolated install smoke before proper local promotion. |
| GSD-W054 | MCP integration Part 2 umbrella and children | Upstream | PR required | [#2666](https://github.com/open-gsd/gsd-pi/issues/2666) | — | — | **Idea** — umbrella #2666 plus children #2667-#2672 opened 2026-10-06 after read-only research at upstream/main `8317811c`; scoped continuation of the completed #2099 foundation covering canonical consumer guards, sidebar freshness, fallback composition, smoke precision, and real host evidence. Implementation not approved. | Await maintainer triage on #2666; no implementation branches before scope confirmation. |
| GSD-W056 | Classify status-only 400 Bad Request as transient | Upstream | PR required | [#2275](https://github.com/open-gsd/gsd-pi/issues/2275) | [#2276](https://github.com/open-gsd/gsd-pi/pull/2276) | `fix/bare-400-statusline-transient` | **Closed unmerged** — PR #2276 (2026-09-11) proposed treating status-only 400s as transient network errors (wedge W-a8123253). Upstream did not take it; both commits remain carried in fork releases 1.21.1-fork.1+ (GSD-W053). | Keep carried in fork releases; revive upstream only with fresh maintainer signal on #2275. |

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
| GSD-W020 | Repo-wide markdownlint config: disable MD013/MD060 | Upstream | Historical | #1992 | #1991 | Config slice merged in `55d6c58d`; #1992 remains open for the deferred 6,472 content-level violations |
| GSD-W021 | Repair evidence-backed lifecycle shadow authority before Milestone validation | Upstream | PR required | #2055 | #2002 | Merged upstream on 2026-08-29; no active lifecycle-shadow-authority worktree remains |
| GSD-W025 | Verify multilingual verify-command fixtures | Upstream | Historical | #1994 | — | Dropped — out of scope for this fork (external issue #1994 by @efrembaraldo; won't implement) |
| GSD-W026 | UAT contract: canonical `nonAutomatable` flag | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W027 | Mixed milestone validation/schema: class-pass under aggregate needs-attention | Upstream | Historical | — | — | Dropped — out of scope (speculative idea; won't implement) |
| GSD-W028 | Stale local path cleanup in docs and settings | Fork-local | No PR planned | — | — | Complete — `~/.gsd/agent/settings.json` points to `current fork checkout` |
| GSD-W055 | Register liveness identity on rejected unit-run claim | Upstream | PR required | #2097 | #2098 | Merged in `f8ac9530755d8d6fd5b2b8772c36fe76eaa71364` (2026-09-03); verified contained in upstream/main 2026-10-07 |
| GSD-W057 | Clamp passing class verdict under non-succeeded milestone validation | Upstream | PR required | — | #2308 | Merged in `7cb0d741556bd75f8344b9ca5e4fafab157380ba` (2026-09-14); verified contained in upstream/main 2026-10-07 |
| GSD-W058 | Correct gpt-5.6-luna/terra capability-tier misclassification | Upstream | PR required | — | #2393 | Merged in `cc8779fe308376b617456e042190b04298ff9f10` (2026-09-20); verified contained in upstream/main 2026-10-07 |
| GSD-W059 | Recover from stale milestone lease in orchestrator claim path | Upstream | PR required | #2406 | #2407 | Merged in `ca09ac8050c848fa583b7eebe40c6084791c49b0` (2026-09-23); verified contained in upstream/main 2026-10-07 |
| GSD-W060 | Recover edit tool calls that misname the edits field | Upstream | PR required | #2408 | #2409 | Merged in `8d301870b40a7040b3ccb1ceb96633aa136be91b` (2026-09-23); verified contained in upstream/main 2026-10-07 |
| GSD-W061 | cmux split panes open as empty/plain shells instead of attaching subagents | Upstream | PR required | #2050 | [#2695](https://github.com/open-gsd/gsd-pi/pull/2695) | PR open; `d2ce3a05` pushed to origin; fresh build and 38 targeted tests pass. MCP read/write returned HTTP 401; user-authorized gh/git fallback used. Fork integration tracked with GSD-W053; runtime remains unchanged and automatic splits disabled. |
| GSD-W062 | Fresh-context subagent runs are not resumable | Upstream | No PR planned | — | — | Investigation complete: fresh runs intentionally use `--no-session`; only fork-context children retain a session file. No selector defect proven; optional error-message clarification remains future work. |
| GSD-W063 | Atomic MCP PID registry writes prevent partial JSON reads | Upstream | PR required | [#2696](https://github.com/open-gsd/gsd-pi/issues/2696) | [#2698](https://github.com/open-gsd/gsd-pi/pull/2698) | PR open at `26e5774b`; private exclusive temporary writes plus atomic rename reviewed, 44 tests pass three repeats and integrated affected suites 69/69 pass. Related infrastructure only, not W054/C1-C6 completion. |
| GSD-W064 | C1 canonical native Copilot project-context guard | Upstream | PR required | [#2667](https://github.com/open-gsd/gsd-pi/issues/2667) | [#2699](https://github.com/open-gsd/gsd-pi/pull/2699) | **PR #2699 open** at reviewed head prefix `1f64`; independent C1 review LOOKS_GOOD with extension tests. Integrated into fork.5 candidate; no local build/test run in this closeout; no false release-complete claim. Native wire contracts unchanged. Upstream scope/assignment discussion remains pending; no real external-host or C2-C6/F1-F4 acceptance claimed. |
| GSD-W065 | macOS native descendant enumeration divides PID element count twice | Upstream | PR required | [#2700](https://github.com/open-gsd/gsd-pi/issues/2700) | — | Separate future native correctness issue registered from the fork.5 release gate; not claimed as delivered by W053 or the C1/MCP work. |

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

## Recent upstream issue drafts

- **GSD-W043** — [#2395](https://github.com/open-gsd/gsd-pi/issues/2395): show the authoritative dynamic-routing tier in the live `GSD AUTO` strip as a focused follow-up to #2078/#2207. Status: **idea**; awaiting maintainer triage.
- **GSD-W044** — [#2396](https://github.com/open-gsd/gsd-pi/issues/2396): show live per-subagent model, thinking, lifecycle state, and elapsed time. Status: **idea**; awaiting maintainer triage.
- **GSD-W045** — [#2397](https://github.com/open-gsd/gsd-pi/issues/2397): add a first-class `/gsd routing` TUI over the production router, with defaults contract, source-aware configuration, preview, history, and atomic save. Status: **idea**; awaiting maintainer triage.

## Local extension patches (temporary, not part of any PR)

Human-readable projection of `work-register.json`'s `localExtensionPatches[]`. These are
personal, machine-local gsd-pi community extensions that reimplement not-yet-merged PR
behavior so the feature can be used day-to-day before the real PR ships. They are never
committed to any PR branch and are not upstream contributions in their own right.

| Extension ID | Path | Related work | Status | Reimplementation | Notes |
| --- | --- | --- | --- | --- | --- |
| `copilot-catalog-patch` | `~/.gsd/agent/extensions/copilot-catalog-patch` | GSD-W014, GSD-W017, GSD-W018 | **Retired & deleted** (2026-08-29) | Yes | Retired after the local workaround was no longer needed; #1978 merged, while #1979/#1980 closed unmerged and must not be carried into the v1.18 fork update. |
| `w022-iserror-patch` | `~/.gsd/agent/extensions/w022-iserror-patch` | GSD-W022 (PR #2016) | **Retired** | Yes | Retired 2026-09-07: #2016 merged at `9212937f` and shipped in v1.18.0, which the active runtime now runs. Removed from the runtime; archived at `plans/patches/archive/2026-09-07-pre-cleanup/w022-iserror-patch-runtime-extension/`. |

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
