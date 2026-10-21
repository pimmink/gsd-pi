# Pre-publication review receipt

> [!IMPORTANT]
> Review verdicts concern this planning/publication packet. They are not maintainer design approval, passing product tests, provider interoperability, packaged feature delivery or real-host adoption.

## Subject

| Item | Recorded subject |
| --- | --- |
| Date | 2026-10-21 |
| Source | `ee286ce386f79acc240e7fbbe10ece892cedc534` |
| Packet | `U.md`, `C01.md`–`C07.md`, with `PLAN.md` and `HANDOFF.md` |
| Initial reviewed template digest | `71aca2a1dc05d2f7f1288cbda220d05f2b915307c5e3cd29ec21f9e1c808c816` (before the operator's agent-first refinement) |
| Current live body hashes | `publication.json` version 2; all eight exact raw bodies/titles/IDs/OPEN states independently verified |
| Publication authorization | Operator requested umbrella plus all seven children after final review |
| Implementation authorization | None inferred; route, contract, consumer and maintainer gates remain explicit |

## Independent findings and disposition

| Review | Finding | Disposition |
| --- | --- | --- |
| Planning audit | Original three-graph inventory conflated native Pi memory and standalone MCP project tools | Corrected to four surfaces; explicit `gsd_memory_graph` alias and distinct native build semantics |
| Planning audit | Provider feasibility must inform the contract before freeze | C03-A precedes C02 contract freeze; C03-B waits for the accepted seam; no whole-issue cycle |
| Planning audit | Existing project-root validation is not source/index binding | Host-owned project/worktree/index mapping and trust decisions required; no invented vulnerability claim |
| Architecture review | Packet sufficiently concrete and safe within stated gates | `LOOKS_GOOD`, no blocking architecture findings |
| Architecture advisory | C03 dependency shorthand could hide the phase split | C02 now names C03-B dependency and exempts C03-A feasibility |
| Architecture advisory | Credential wording conflicted with an approved authenticated provider option | C04 distinguishes credential-free disabled/absent mode from separately approved authenticated/remote operation; no implicit key collection or writes |
| Evidence review | C05 lacked its standalone post-pilot implementation prerequisite | Blocking finding fixed in C05, C07, U and PLAN: base-route C07-B pilot checkpoint plus linked post-pilot demand decision; not whole-C07 closure |
| Evidence follow-up | Rechecked the dependency correction and both advisories | `LOOKS_GOOD`; no remaining blocker or C05/C07 completion cycle |
| Operator clarification follow-up | Existing native Graphify continuation and agent-first banners/order/outputs on all eight bodies | `LOOKS_GOOD` in `eecee524-25a5-4468-8c87-25dc9296f4b5`; no external-provider installation or convention-acceptance claim |

## Artifact validation

- [x] Eight bodies have one H1, status alerts, real GFM tables and acceptance task lists.
- [x] 61 pinned source references across 29 source files resolve to existing files and valid line ranges.
- [x] Selected graph taxonomy, phase gates, SDK compatibility and C05 pilot-gate invariants checked.
- [x] Renderer tests cover link context, missing aliases, repository binding and provisional references; no nested Markdown links.
- [x] New renderer/validator pass scoped Biome; the ten planning Markdown documents passed scoped markdownlint.
- [x] Final upstream fetch still matched the audited source SHA, with zero relevant drift.
- [x] Current issue-state/claim and late-overlap checks performed; known search-index gaps cross-checked with bounded enumeration.
- [x] The original operator plan was atomically updated to the complete 1,391-line version 3.1 after publication readback; the byte-identical original rollback copy remains intact.

Line-range validation checks existence/ranges, not automatic semantic attribution. Independent reviewers inspected key implementation claims. Proposed product/provider/host verification commands were not executed by writing or reviewing these issues.

## Review records

| Purpose | Run |
| --- | --- |
| Initial planning/source audit | `d05e0207-36e6-415a-a778-842e0bfc6b5b` |
| Replacement source scout | `6b948601-aa8b-4d3b-a171-77c09de613a5` |
| Non-overlapping child authoring | `23e2c99c-e0d3-4273-9a53-a7b058ac3907` |
| Final architecture and evidence reviews | `54d571e0-2ddf-4ff0-9a5d-5f74c4a3c1ea` |
| Narrow final finding-resolution review | `6a9d9562-40da-4051-90da-8fcb4de04c6f` |

Publication and exact raw-body/title/identity/OPEN readback are complete for umbrella #2953 and children #2954–#2960; see `publication.json`. Native hierarchy is **not** established: add returned HTTP 404 and the native list remained empty. All explicit parent/sibling links are verified, and the limitation is stated publicly. This remains planning/publication delivery, not implementation, provider or host acceptance.
