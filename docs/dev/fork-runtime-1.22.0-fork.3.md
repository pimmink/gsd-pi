# Personal fork runtime 1.22.0-fork.3

Merged-only refresh pinned to upstream `2bc28833b3da58f5a5958d02a2b7e0cf202b60ac`, preserving the fork.2 integration `3c2ee92d45fc34337a1cd8c561bf3d284128fd77`. The merge incorporates 11 upstream commits without replaying or discarding the retained capability guards described in `fork-release-manifest.json`.

## Included changes

- Active tool counts distinguish running invocations from retained transcript cards (#2937).
- Failed exec previews include bounded stderr diagnostics (#2943).
- Exec output log paths have keyboard-reachable copy actions (#2939), with purpose/log rendering and documentation (#2922, #2923).
- cmux sidebar status ownership and shared progress coordination are isolated (#2942).
- Background subagent reports render as Markdown (#2938).
- VS Code activity lifecycle and semantic sidebar colors are corrected (#2940, #2941).
- The model catalog is refreshed (#2924), and a worktree-integrity test uses ESM imports (#2921).

Only merged changes are included. Open PR #2920 is not installed by this refresh. Stable native engine dependencies remain pinned to `1.22.0`; the personal-fork package version is not a published engine version.

## Verification and activation contract

Build, extension typecheck, compiled tests, lifecycle gate and release packaging run on the online clean-runner harness against the exact published candidate SHA. Existing fork.2 evidence does not validate fork.3. Archive verification must bind the workflow source SHA, release proof, checksum, member safety and native dependency pins before installation.

Install only a verified archive with scripts disabled, preserve a rollback package and configuration fingerprints, then compare installed and managed resource hashes. Align the canonical checkout with the same source and online-compiled outputs. Restart an existing session before relying on the refreshed runtime; file equality alone is not proof that a running parent has reloaded.

## Auto-mode boundary

This runtime update is not authorization to start nested auto-mode, clear a real user-owned Blocker, fabricate a succeeded Task Attempt or Technical Verdict, spend on live acceptance, or claim application acceptance. Inspect current canonical project readiness separately after activation.
