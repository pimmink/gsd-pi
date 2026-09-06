<!-- markdownlint-disable MD013 -->

# AGENTS.md

## Repository mission

This fork is the working repository for contributions to `open-gsd/gsd-pi`.
Changes intended for upstream must remain focused, tested, documented, and free of
customer-specific code, assets, credentials, or private project context.

## Authority and remotes

- `upstream` must resolve to `open-gsd/gsd-pi` and is the source of truth.
- `origin` must resolve to `pimmink/gsd-pi` and is the contributor fork and PR host.
- Base new work on freshly fetched `upstream/main`, never stale `origin/main`.
- Do not commit directly to `main`.
- Keep one concern per branch, worktree, and PR unless a maintainer requests otherwise.
- Keep one active patch per work-register ID. Once an issue or PR exists, that patch must cover
  exactly that one `GSD-W###` and one `#issue` or `#PR`; never use a patch as a shared staging
  area for several work items. Name it `YYYY-MM-DD-w###-<topic>.patch` and record its source
  revision and disposition in the matching register entry or local plan.
- An issue is not automatically required for every concern. Search existing issues and PRs
  first and follow current upstream `CONTRIBUTING.md` and maintainer direction.
- Current upstream policy requires an issue first for new features, while obvious bug fixes
  may skip one. Use or claim an existing relevant issue when required; never create a new
  issue without explicit authorization.
- Core or architectural changes must follow current RFC, ADR, and maintainer-approval rules.
- Preserve dirty work. Never reset, clean, stash, delete, or overwrite unknown changes.

## Public and private boundary

The public fork must never contain customer or private-project context. Do not copy or
reference customer names, private assets, AWS identifiers, production data, credentials,
private chat logs, private repository instructions, or private requirements unless the
information is independently public and necessary for the upstream contribution.

## Identity

All commits authored for Pim use:

```text
Pim Immink <pimmink@users.noreply.github.com>
```

Verify repository-local identity before committing. Do not modify global Git identity.

## Governance control-plane

Fork-local contribution governance is tracked only on
`origin/docs/copilot-workspace-governance` and checked out at:

```text
/Users/pimmink/Klanten/gsd-pi-pimmink/worktrees/workspace-governance
```

That checkout is the governance anchor. It owns this file,
`docs/contributor-workflow.md`, `docs/work-register.json`, its Markdown projection,
profile/bootstrap documentation, and validation tooling.

Clean feature worktrees start from `upstream/main` and intentionally do not contain these
governance files. Do not copy them into a contribution branch. Before planning or editing
in a feature worktree, consult the governance anchor through the dedicated
`GSD Pi Contributor` VS Code Profile.

`docs/work-register.json` in the governance anchor is canonical. Update it there whenever
an issue, branch, PR, commit, status, validation result, or next action changes. Then update
`docs/work-register.md`, run `node scripts/validate-work-register.mjs` from the anchor,
and publish only to the governance branch. Register maintenance must never contaminate an
upstream feature PR.

## Required contribution workflow

1. Read current upstream `CONTRIBUTING.md`, `VISION.md`, and relevant repository guidance.
2. Read this file, `docs/contributor-workflow.md`, and canonical
   `docs/work-register.json` from the governance anchor.
3. Fetch both remotes and search upstream issues, PRs, and code for overlap.
4. Confirm whether current upstream policy requires an issue, RFC, ADR, or maintainer
   approval. Report the requirement; do not create or claim anything without authorization.
5. Create a clean worktree from `upstream/main` with one branch per concern.
6. Reproduce the problem before changing code when practical.
7. Add regression coverage that fails before the fix and passes afterward.
8. Format touched files and run the narrowest sufficient checks during development.
9. Escalate through the two-speed verification workflow as confidence and risk require.
10. Update the work register from the governance anchor.
11. Request explicit authorization before any GitHub write.

## Toolchain truth

Read `package.json#engines` and `packageManager` in the active upstream checkout. Those
fields are authoritative. Use Corepack for the declared package manager and do not hardcode
Node or pnpm versions in governance documentation.

## Two-speed verification

Development loop:

1. Format touched files and run targeted tests, builds, and typechecks.
2. Run `pnpm run verify:fast` for local CI fast-gate policy coverage.
3. Run `pnpm run verify:pr` when broader build, extension typecheck, unit-test, and lifecycle
   confidence is needed.

Merge/review loop:

1. Reach a stable implementation and reviewable diff.
2. Run relevant broader or package-specific checks.
3. Run `pnpm run verify:merge` before PR review when current upstream policy requires full
   CI-blocking parity.
4. Push only after authorization, then use GitHub CI as the remote authority.

- For slow or failing `verify:pr`, `verify:merge`, or remote Actions runs, use the profile's
  CI observability tools first: `repo-actions-hub`, `pr-artifact-explorer`, GitHub MCP, and
  the GitHub PR extension when available.
- Once a branch is stable enough to push, prefer the sharded clean-runner verification flow
  documented in `/Users/pimmink/Klanten/gsd-pi-pimmink/ci/docs/remote-verification-guide.md` before
  manually digging through raw logs; fall back to the stable unsharded tier only when the
  sharded harness itself is suspect.

`verify:merge` is not an after-every-edit command. Repeat a prior successful
`verify:merge` when subsequent changes can invalidate its evidence, including relevant
source, tests, dependencies, lockfiles, generated output, build or packaging logic, native
code, CI/gate scripts, or merge-conflict resolutions. Documentation-only or metadata-only
changes need a repeat only when current upstream policy or the changed validation surface
requires it.

Never claim success from planning text or a green subset that does not exercise the changed
behavior. Record commands, exit codes, and relevant results in the PR or work register.

## Runtime and packaging safety

- Source, generated resources, the globally installed package, and managed runtime copies
  are separate activation layers.
- A source edit is not active until its relevant build, install, or explicit local-patch step
  is completed and verified in a fresh process.
- Generated catalogs must come from their generator; never hand-edit generated output.
- Include provider, transport, parsing, fallback, and error-path tests when routing behavior
  changes.

## Formatter and editor safety

This workspace contains many stale and active worktrees side by side. Do not use automatic
editor formatting, organize-imports, or save-time fix-all actions as part of cleanup or review:
they can rewrite old PR branches and make local patches look substantive. The workspace root
`.vscode/settings.json` disables format-on-save, format-on-paste, format-on-type, save-time
fix-all, save-time organize-imports, Biome, Prettier, and ESLint formatting by default.
It also disables TypeScript project-wide diagnostics and excludes generated `dist/`, `dist-test/`,
`node_modules/`, and `native/target/` folders from editor watching. This prevents stale build
outputs in old worktrees from surfacing `TS5055 Cannot write file ... because it would overwrite
input file` in the Problems panel. Local `plans/**` files are ignored by markdownlint because they
are private planning memory, not upstream documentation.

Formatting is allowed only as an explicit, scoped command for the active concern after a preflight
dirty-state check. Record the command and run `git diff --check`; never save-open files across
multiple worktrees to “clean up” style.

## Upstream release reconciliation and cleanup

Before updating the fork to a new upstream release, rebasing a long-lived branch, or cleaning
an old checkout, inventory every non-clean checkout and every preserved patch under
`$GSD_PI_WORKSPACE/plans/patches/`. Fetch `upstream/main`, then classify each item against that
exact revision as one of:

1. **Already upstream** — its intended behavior or commit is present in `upstream/main`.
  Keep only archival evidence; do not recreate or push a competing PR.
2. **Open PR** — a remotely published branch has a live PR. Preserve the branch/worktree,
  inspect current CI and mergeability, and rebase only when it is behind or conflicting.
3. **Local-only** — unique commits or dirty changes with no live PR. Export or retain a
  focused patch and record its scope, source revision, validation, and next action in the
  work register before cleanup. Do not silently drop it.
4. **Blocked or intentionally retired** — retain its explicit decision/evidence, but do not
  carry it forward as an implementation candidate without the required RFC or fresh repro.

Never treat a mixed staged state in an old fork checkout as a PR candidate: first split it into
focused concerns against current `upstream/main`. A diff from a stale checkout can look like it
deletes code that upstream has since added. Generated/catalog churn must be regenerated from the
current source when needed, not carried as an old patch.

The sole exception is a clearly named historical archive such as `*-mixed-archive.patch`: it is
read-only evidence, must not be applied or published wholesale, and must point to the individual
W-scoped patches or register records that superseded it.

For each open PR branch, record `upstream/main...HEAD` ahead/behind counts, the PR head SHA,
mergeability, and current CI conclusion. For each local patch, compare its affected paths and
intent against the new upstream revision before deciding whether it is obsolete, requires a
focused PR, or remains local-only. Update `docs/work-register.json` first, then its Markdown
projection, and validate with `node scripts/validate-work-register.mjs` before destructive
cleanup. Removing worktrees, branches, or the old fork requires explicit authorization.

Use `scripts/contribution-snapshot.mjs` from the governance anchor for one W-scoped comparison.
Pass the PR head SHA retrieved through GitHub MCP with `--remote-head`; `remoteHeadMatchesLocal:
true` proves the local worktree equals the online PR head. Add `--patch <file>` to compare stable
patch IDs: `matchesWorktreeDelta: true` means the artifact exactly matches the current branch
delta, while `false` means it is partial or superseded and must be retained only with an explicit
successor/disposition. `unknown` means the remote SHA was not available and is not evidence of
equality.

## GitHub writes

- GitHub MCP is the primary GitHub integration.
- All outward-facing GitHub writes require explicit authorization.
- If GitHub MCP demonstrably cannot perform an authorized write, record the failure and use
  `gh`-managed Git authentication only for that specifically authorized fallback.
- Read-only inspection may use GitHub MCP or bounded `gh` commands.
- Never force-push, merge, close, delete a branch, or rewrite history without separate
  explicit authorization.

## Secrets and MCP

- Never commit PATs, tokens, cookies, credentials, populated `.env` files, or secure-input
  values.
- Prefer OAuth-enabled remote MCP servers.
- The dedicated VS Code Profile owns runtime MCP configuration for clean feature worktrees.
- The tracked `.vscode/mcp.json` on the governance branch is a minimal reference and anchor
  configuration only; it must not be copied into feature branches.
- `.env.example` documents optional secret names only and must remain empty.

## Work-register records

Every entry needs a stable ID, type, concise problem statement, scope, upstream disposition,
issue/PR/branch/commit references, current status, evidence date, validation or known gap,
and next action. Fork-local work uses `upstreamDisposition: no-pr-planned`. Closed,
superseded, and abandoned work stays recorded. Never reuse work IDs.
