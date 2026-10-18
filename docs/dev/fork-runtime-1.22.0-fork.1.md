# Personal fork runtime 1.22.0-fork.1

## Source and release identity

This fork is based on upstream `e92df12eda1639ab252f377bf6aba10af139b542`, which includes the 1.22.0 release. The previous integration branch at `b82fc9d63238f14d6cdc10c60ca9c8e3eb0d4f47` did not contain the 1.22.0 release. A newer source checkout or local package override does not upgrade an installed CLI or its managed resources.

The source-owned `fork-release-manifest.json` is included in the package. Packaging must additionally bind the archive checksum to the actual tested source commit. A version label or this manifest alone is not proof that a running process loaded the replacement.

## Semantic patch disposition

All 45 old integration candidates were examined against the frozen upstream source and tests. A different SHA or non-equivalent patch-id is not sufficient reason to replay a patch. Historical release/version commits and cumulative fixture changes are not independent runtime requirements.

| Earlier concern | Current disposition |
| --- | --- |
| Status-only 400 and provider-prefix recovery | Use upstream implementation and its tests; do not replay old copies. |
| macOS write EIO | Use the upstream guarded output-stream implementation. Never replace it with the older broad recovery rule that could hide filesystem failure. |
| Complete async job output and declaration discovery | Already provided upstream; do not replay. |
| cmux activation and subagent activity | Use upstream integration, including later streaming fixes. |
| Slice reopen and lifecycle atomicity | Use upstream implementation; no manual DB/adoption mutation. |
| Provider adapter restoration and generated catalog snapshots | Already superseded upstream; preserve current adapter behavior, endpoints, pricing and limits. |
| Copilot selectable effort, live capability normalization and overlay serialization | Retain the missing intent of `ccad185b04fa`, `4b28db60bf41` and `a8d17fac04e7`, adapted to current source. |
| Copilot-only generator metadata and provider-negative guards | Retain the missing intent of `c83f2557`, `b6d65f26` and `4e9106c6`; do not overwrite the current generated catalog. |
| Numeric fork engine versions | Retain `2f5ba38327`: `1.22.0-fork.1` reuses stable `@opengsd/engine-*` version 1.22.0. Other malformed/rc labels do not silently normalize. |
| Personal-fork hosted runners | Retain `f92e6505ee` only for the personal fork; upstream owners keep their Blacksmith configuration. |

## Integration regressions and verification scope

The first actual combined provider test run exposed two differences. The compatibility guard must fail closed when Copilot Completions reasoning support is missing, not only when it is explicitly false. The preserved OpenAI GPT-5.6 control must expect current upstream's `off: "none"`, not the older fork's mapping. The implementation and control were corrected without broadening the Copilot rule to other transports.

Current targeted proof includes 59 provider/generator tests, 57 compiled catalog/overlay/diagnostics/ADR-012/runner tests, 12 version/native tests and full test compilation. New fixtures must be tracked explicitly, including `provider-thinking-metadata.ts`; a clean-looking default status can hide untracked files. Test counts are scoped and do not assert complete cross-platform verification.

The core build and provider rebuild are distinct from a web production build. Any Next.js production build and distributable archive assembly for this release are assigned to the online lane, not the local workstation. Existing trusted source-ref/SHA checks and normal test gates must remain intact when producing the archive.

The first exact-source online attempt stopped at the extension typecheck before any package was built. Its diagnostic fixture needed an explicit `Model<Api>` transport union and a typed captured payload record; those repairs preserve the fixture's transport assertion and payload checks. The complete extension typecheck passes after the annotations. A changed source commit requires a new online verification attempt; the failed attempt is retained, not retried unchanged or counted as distribution proof.

## Installation boundary

Do not install from a dirty or untracked source closure. Retain the previous runtime until a source-bound archive is available and verified. After installation, compare the CLI version and package provenance, then initialize managed resources through the supported fresh-process path and compare fix-specific files with the installed package. Existing processes need restarting; configuration alone does not activate a new runtime.

No generated catalog refresh, paid model inference, Windows success, project lifecycle completion or database adoption is implied by this release note.
