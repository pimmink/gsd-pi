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
