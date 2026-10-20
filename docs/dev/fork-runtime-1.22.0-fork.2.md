# Personal fork runtime 1.22.0-fork.2

This personal fork refresh is based on upstream `c6e8f8990b9fdf1c8af0c9d176c3eb5f3344a114`. It supersedes the installed `1.22.0-fork.1` source `e01e57a32ce6d51e6e3bf3775cdef8cb9d83c199` only after independent package and activation verification.

## Scope and retention

The refresh includes merged upstream changes, including the native Blocker command boundary from #2865. The still-unmerged #2920 auto-recovery feature is deliberately excluded. This is a fork-local release, not a new upstream feature proposal.

The eight historical local intent commits are provenance for six semantic categories, not instructions to replay eight commits. Retained behavior includes fail-closed Copilot Completions effort controls, live endpoint capability intersection and overlay fidelity, Copilot-only generator family rules, the ADR-012 exception, stable native engine resolution for numeric fork versions, and personal-fork-only hosted runner fallback. Regression tests retain positive and negative provider and transport boundaries.

Upstream MiniMax generation and newer engine identity tests are retained. Readiness/cache-clock patches already merged upstream are not reapplied. The MCP test command retains the new `resolve-blocker` registration. Native optional dependencies stay pinned to the stable `1.22.0` engine release rather than an unpublished fork binary.

## Verification and package provenance

The first online run passed 17,468 unit tests but failed the cleanup hook of the upstream state-directory copy-permission test. Its copied fixture retained read-only permissions after the source permissions were restored. The fixture now restores both directories only after the real production copy/source-cleanup path runs; production behavior and assertions are unchanged. Node's `rmSync({ force: true })` ignores missing paths, not permission failures. The existing test and its cleanup provide the regression check; the changed source must pass a fresh online gate before packaging or installation.

Builds, native compilation, extension typechecking, the complete unit suite, lifecycle shadow gate, web build and release packaging run online against the frozen source SHA. The release archive must contain `dist/fork-release.json` and this release manifest; its separately recorded checksum must match the verified workflow artifact. The workflow control SHA is not the tested source SHA.

The generated `web/next-env.d.ts` root-parameter import is retained so the online web build and packaging guard can verify that tracked source remains unchanged. No local production build or dependency regeneration is required.

## Activation boundary

A source commit or green build is not proof of installation. Keep rollback copies, stage the exact verified archive with installation scripts disabled, check the CLI and real native binding, then verify installed and managed-resource fingerprints in a fresh process. Preserve local configuration and canonical checkout overrides; reuse online-compiled SDK output rather than building it on the laptop.

This update does not resolve a real user-owned Blocker, adopt project authority, authorize a Task retry or paid generation, complete a Task, or prove application acceptance. Existing sessions must restart before relying on the refreshed runtime.
