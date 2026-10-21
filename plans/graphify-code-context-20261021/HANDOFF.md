# Graphify / source-bound code-context contribution handoff

> [!IMPORTANT]
> Reviewed publication contract, published and verified on 2026-10-21. This folder owns an upstream contribution plan, not an Edelman application milestone. No feature, contract, adapter convention, maintainer approval or implementation is declared delivered by this document.

## Operator follow-up — existing foundation and agent-first bodies

The operator explicitly requested that the umbrella say up front that native `/gsd graphify` already exists and this work builds on it. All eight bodies now begin with an agent-optimized handoff and concrete order/outputs; C01 is the intentionally docs-focused child, not a label for the whole initiative. External Graphify-Labs installation/integration remains distinct from the existing native prompt command. Labels remain triage/classification, not implicit implementation acceptance. Finish all issue/plan readbacks before starting the separately requested #2858 review/conflict repair.

## Authority and source subject

| Item | Value |
| --- | --- |
| Upstream source baseline | `ee286ce386f79acc240e7fbbe10ece892cedc534` |
| Original plan baseline | `b6d7c31f2c32168b8073cb321f2b5f114b394d76` |
| Original input | `GSD-Pi-Graphify-contributieplan-2026-10-19 (1).md`, v2, 867 lines |
| Current request | Refresh source/overlap evidence, make agent-pickable umbrella and children, review the complete packet, then publish all issues |
| Publication is not adoption | Every conditional implementation stays blocked on real maintainer decisions and dependencies |
| Formatting | Rich GitHub Flavored Markdown: alerts, headings, real tables, task lists, fenced examples with a language, precise links; no plain dumps or fabricated evidence |

## Existing work: do not duplicate

- #2857 is closed; #2862 delivered the prompt freshness/static-edge improvements. #2858 is related earlier contribution material, not a new adapter convention. Re-read maintainer decision <https://github.com/open-gsd/gsd-pi/issues/2857#issuecomment-6225505736> before proposing an integration seam.
- #2666 remains the canonical MCP Part 2 umbrella. #2667 is now closed/delivered. The new plan must reuse its canonical native project-context guard boundary, not reopen or recreate it.
- #2671 and #2672 remain existing native/external MCP-host evidence scopes. Graph-specific acceptance must reuse or clearly extend them, not claim their general closure.
- #2810 is a closed source-context ownership fix; do not restate the old symptom as a current upstream defect without reproducing it.
- #2822 and its children own general subagent observability/cost/session work. C06 must inventory/reuse it and cannot recreate that umbrella.
- #2913/#2932 are separate TUI design work; #2948/#2951 repair blocker inspection/instructions. Graph navigation must never become lifecycle, approval or release evidence.
- MCP search returned no Graphify matches despite known #2857. Parent cross-checked 1000 issues (numbers 566..2950) using bounded `gh issue list` under D278; this is bounded dedup evidence, not a repository-wide absence proof. Read canonical current issue state/claims before pickup.

## Preserve four distinct graph surfaces

1. Native `/gsd graphify`: prompt workflow, existing nodes/edges storage and annotation preservation. Do not promise side-effect-free adapter status from that dispatcher.
2. Native Pi `gsd_graph`: memory relationships/supersedes traversal; its build path does not rebuild the standalone MCP workflow graph. This distinction was missing from the original three-graph inventory.
3. Standalone MCP `gsd_graph` and CLI `gsd graph`: project/workflow knowledge graph and existing readers/storage, not a source call graph. Same tool name does not imply the native Pi contract.
4. An optional external source graph: derived navigation evidence bound to an explicitly selected repository, worktree, eligible input fingerprint and index/provider revision. It never overrides the canonical workflow database.

The source baseline resolves MCP SDK 1.29.0 from a ^1.27.1 range. Current SDK-main/v2 examples are not implementation authority for this checkout; the local wrapper uses `McpToolExtra.signal`. Propagate cancellation deliberately and re-check the actual dependency version before implementation.

## Outcome-neutral route gate

The umbrella must compare existing project skill + CLI + separate provider MCP, external extension/companion, and minimal core integration only if a concrete consumer gap is demonstrated. R0 (existing routes/docs are enough), R1 (extension/companion) and R2 (small core seam) are all legitimate outcomes. Opening all seven children is backlog publication, not maintainer approval or permission to start gated implementation. No default Graphify dependency, new daemon/endpoint, installer, automatic extraction or paid semantic service.

## Aliases and work boundaries

| Alias | Scope | Pickup boundary |
| --- | --- | --- |
| U | Outcome-neutral route/consumer decision and coordination | RFC/design; no implied implementation approval |
| C01 | Clarify native/workflow/external graph routes without inventing an accepted convention | Source/docs gap analysis can start; no redundant PR if current docs already satisfy it |
| C02 | Bounded optional code-context contract and generic seam for the accepted route | Research/design first; runtime seam only after linked route/contract approval |
| C03 | Provider feasibility early; opt-in, source-bound Graphify reference integration late | Phase A read-only feasibility must inform C02 contract freeze; phase B runtime integration waits for C02. No default dependency or implicit indexing |
| C04 | Optional MCP read exposure using existing canonical authority/transport boundaries | Blocked on accepted MCP consumer/contract and provider path; preserve native caller authority |
| C05 | Conditional Task/context composition | Demonstrate a gap beyond existing reads; no new global prompt tax or workflow truth from graph evidence |
| C06 | Conditional missing diagnostics | Inventory current skill/MCP/subagent/session diagnostics first; add only demonstrated missing dimensions |
| C07 | Verification contract early; graph-route-specific provider/package/real-host acceptance late | Phase A can start early; phase B waits for the chosen route and dependencies. Each owner PR must supply its own tests; C07 is not a late testing dump. Do not claim existing host issues closed |

## Mandatory standalone child contract

Each issue body must be actionable without this local folder. Include:

- A rich GFM heading and status callout, source baseline, parent link placeholder, explicit current-state/claim-first pickup rule.
- Summary; problem/evidence with real source links and line anchors; scope/non-goals; concrete outputs/likely owner files; dependencies and what is ready versus blocked.
- Proposed steps; acceptance checklist; deterministic verification commands using the actual repository test harness; negative/boundary matrix with expected outcomes.
- Evidence classes and limitations; legitimate no-change/stop path; maintainer decisions required; related/duplicate issue dispositions.
- No fake test runs, no invented existing API/schema/file, no assumption that opening an issue accepts a new convention. Proposed new files/types/tool names must be visibly proposals.

Use placeholders `{{U}}`, `{{C01}}` through `{{C07}}` only for publication links; parent will render every one before final body updates. Do not use angle-bracket command arguments that an intermediate sanitizer could strip; use `BLOCKER_ID`, `SOURCE_ROOT`, etc. Never publish unresolved placeholders.

## Shared safety and proof invariants

- Independently bind trusted project/checkout identity, source repository/worktree and provider/index identity. A provider echoing its own root is not independent verification. Existing optional `GSD_WORKFLOW_PROJECT_ROOT` validation and external `.gsd` state-root allowance are not sufficient source/index binding.
- Keep installed/configured/discovered/callable/authorized/active-session observations separate. Unknown remains unknown; registered does not prove callable or adopted.
- Bound all requests/responses, citations, subprocess lifetime, cancellation and diagnostics. Read operations never request install/build/refresh/extraction/inference, writes or service startup. Disabled/absent modes require no provider installation or credentials. Any explicitly selected authenticated/remote provider needs its own accepted trust boundary; no arbitrary model-provided executable/URL/root authority or implicit network/spend.
- A fixed argument vector and `shell: false` are not an OS sandbox. Decide whether the provider is trusted code, reads validated artifacts only, or runs under enforced containment. Checking selected directories for changes does not prove global non-mutation by an arbitrary process. Environment allowlisting, separate stdout/stderr caps and process-tree termination are required design questions, not assumed protections.
- Preserve unknown/stale freshness, partial coverage, zero matches, unsupported input/schema, unavailable provider, wrong identity, authorization failure, timeout/cancellation and provider error as distinguishable outcomes. Do not collapse them into success or empty output.
- HEAD equality/age alone is insufficient. Include eligible working-tree/untracked input changes, index producer/schema versions and before/after race checks. Separate worktrees and shared common Git dirs must not share identity accidentally.
- Realpath/symlink/allowlist validation, path traversal, secret/customer-asset exclusion, untrusted content and redacted provider diagnostics are explicit contracts. No arbitrary shell interpolation, implicit network/spend or write-on-read.
- Fake contract tests prove only the contract. Captured real-provider parser fixtures, installed/package optional-absence tests, and actual native/external-host invocation traces are separate proof. A successful build or screenshot is not protocol, freshness or task-quality proof.
- Use existing Node/compiled workspace test conventions. Missing workspace `dist` prerequisites are test setup failures, not product regressions. Test commands below issue bodies are proposed verification steps, not executions performed by issue publication.
- Current application Graphify prior-art index was stale and query refused. No graph rebuild or successful application graph query is claimed, and no private application assets belong in public drafts.

## Publication gate

- [x] Current upstream/source/issue overlap audit complete.
- [x] All eight bodies complete and source-grounded, with explicit native-Graphify continuation and agent-first handoffs.
- [x] Independent architecture and agent-pickup/evidence review complete; blocking findings resolved.
- [x] Rendered bodies pass link/placeholder/format/scope checks.
- [x] Created umbrella #2953 and children #2954–#2960 after review; exact live bodies/titles/identities/OPEN states and explicit links read back. Native add was refused with HTTP 404; native hierarchy is not claimed and the limitation is public.
- [x] Original operator plan atomically updated to full version 3.1 with all eight current contracts; byte-identical v2 rollback copy preserved. See `publication.json` and `operator-plan-receipt.json`.
