# Personal fork runtime 1.22.0-fork.4

Controlled refresh to upstream `7652990959594bbec2b19751236d8aba1ca8ad5c`, retaining the reviewed source intents listed in `fork-release-manifest.json`.

## Included source changes

- Merged upstream blocker inspection context and clear-only guidance (#2962), bundled recovery guidance (#2963), failed sub-issue reconciliation (#2965), labeled partial MCP output (#2970), Copilot GPT-6 Responses routing and provider errors (#2971), child skill-discovery evidence documentation (#2972), and sessionless subagent resume diagnostics (#2975).
- Retain the reviewed #2684 fail-closed Copilot reasoning behavior and the fork's stronger requirement for explicit Completions compatibility.
- Integrate the reviewed #2735 generator and seven-model serving-limit/effort-map overrides. Keep upstream's final-pass GPT-6 normalizer instead of duplicate early GPT-6 routing.
- Preserve the fork's provider-qualified family predicates, vendor/datetime variants and offline generator fixtures. Merge both sets of provider/routing regressions.
- Retain #2858 caller-scope and bounded-source Graphify guidance, and #2951 diagnostic-prose/bare-recover safeguards.
- Do not include experimental unmerged #2920. Do not create a duplicate of the feature already delivered upstream by #2962.

## Merge decisions and regression evidence

The blocker command/inspection and command tests use upstream's implementation, preventing a duplicate `guidance` property. The domain-operation test also retains the repeated-inspection revision assertion. The recovery skill and its guidance tests preserve the two reviewed safeguards absent from merged upstream.

The first combined catalog test exposed three stale Completions fixtures that still selected now-Responses GPT-6 models. The reviewed #2684 fixtures now use real Completions IDs, preserving the original boundary assertion rather than weakening it.

Focused checks on the integrated source passed 105 pi-ai tests, 42 catalog/overlay tests, 79 native authority/recovery/Graphify tests, and the pi-ai no-emit typecheck. The first online run (`39664079391`) reached extension typechecking and correctly rejected two additional fork diagnostics fixtures that still assumed GPT-6 used Completions. Those fixtures now select actual declared Completions models, without casts, suppressions, or weakened wire assertions. Their offline diagnostics suite passes 11 tests and the full extension no-emit typecheck passes. The next exact-source online CI/package gate and runtime installation remain separate proofs; this source document does not claim their success.

## Packaging and activation boundary

Use exact-source GitHub Actions build artifacts, never a local production build. Require successful relevant online checks before consuming the artifact. Rewrite workspace dependencies using the repository prepack helper, create the archive with lifecycle scripts disabled, and keep the native engine pinned to the published stable `1.22.0` baseline. Never install Ubuntu native test binaries on Darwin.

Source version, online artifact, archive checksum, global package, managed resources and a fresh process are separate proofs. No source commit or matching version label alone establishes activation. Installation must preserve user settings, credentials, unapproved model pins and project lifecycle state.

## Existing project checkpoints remain intact

This refresh neither clears a human-owned blocker nor authorizes a Task retry, adopts a database, resets historical completion, approves production acceptance or starts auto-mode. Native human approval and a separately checked Recovery Action remain required where applicable.
