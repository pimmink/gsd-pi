<!-- markdownlint-disable MD013 -->

# AGENTS.md

## Repository mission

This fork is the working repository for contributions to `open-gsd/gsd-pi`.
Changes must remain suitable for upstream publication: focused, tested, documented,
and free of customer-specific code, assets, credentials, or private project context.

## Authority and remotes

- `upstream` (`open-gsd/gsd-pi`) is the source of truth.
- `origin` (`pimmink/gsd-pi`) is the contributor fork and PR branch host.
- Base new work on a freshly fetched `upstream/main`, never stale `origin/main`.
- Do not commit directly to `main`.
- Use one issue, branch, worktree, and PR per concern unless a maintainer requests otherwise.
- Preserve dirty work. Never reset, clean, stash, delete, or overwrite unknown changes.

## Identity

All commits authored for Pim use:

```text
Pim Immink <pimmink@users.noreply.github.com>
```

Verify repository-local identity before committing. Do not modify global Git identity.

## Required workflow

1. Read this file, `CONTRIBUTING.md`, and `docs/contributor-workflow.md`.
2. Read `docs/work-register.md` and its canonical machine-readable source,
   `docs/work-register.json`.
3. Fetch both remotes and verify whether the issue or fix already landed upstream.
4. Create a clean worktree from `upstream/main`.
5. Reproduce the problem before changing code when practical.
6. Add a regression test that fails before the fix and passes afterward.
7. Format touched files and run the narrowest sufficient checks during development.
8. Run broader checks when the change crosses packages, runtime boundaries, packaging,
   persistence, authentication, orchestration, or release behavior.
9. Update both work-register files when issue, branch, PR, commit, status, or next action changes.
10. Run `node scripts/validate-work-register.mjs` after register changes.
11. Request explicit authorization before any GitHub write.

## Validation baseline

- Node: respect `package.json#engines` (currently Node 22.18 or newer).
- Package manager: use the exact `packageManager` version through Corepack.
- Formatting and lint: `pnpm exec biome check --write <touched-files>`.
- Targeted tests first; use package-scoped commands where possible.
- Use `pnpm run verify:merge` for cross-cutting or release-risk changes.
- Never claim success from planning text or a green subset that does not exercise the changed behavior.
- Record command, exit code, and relevant result in the PR description or work register.

## Runtime and packaging safety

- Source, generated resources, the globally installed package, and the managed runtime copy are separate layers.
- A source edit is not active until the relevant build/install or explicit local-patch step is completed and verified in a fresh process.
- Generated model catalogs must come from their generator; do not hand-edit generated JSON or TypeScript.
- Interrupted bootstrap/build flows must restore source shims and leave no stale backup directory.
- Do not mix generated output from a different branch into a commit.

## GitHub operations

- Use GitHub MCP first for repository, issue, PR, review, and check operations.
- If a correctly formed MCP write fails because the MCP service or credential lacks access,
  `gh`-managed Git authentication is the approved fallback for that explicitly authorized operation.
- Record the MCP failure and fallback result.
- Read-only inspection may use GitHub MCP or bounded `gh` commands.
- Never force-push, merge, close, delete a branch, or rewrite history without separate explicit authorization.

## Secrets and MCP

- Never commit PATs, tokens, cookies, credentials, or populated `.env` files.
- Prefer OAuth-enabled remote MCP servers. The tracked `.vscode/mcp.json` uses the official GitHub Copilot MCP endpoint and requires no committed PAT.
- If a local GitHub MCP process genuinely requires a PAT, use the secret name
  `GITHUB_PERSONAL_ACCESS_TOKEN` through VS Code secure input, the OS keychain, or a gitignored `.env`.
- `.env.example` documents names only; values must remain empty.
- Treat every MCP server as code with workstation privileges. Keep the server set minimal and review commands before accepting trust prompts.

## Public-repository boundary

Do not include customer names, customer assets, private AWS identifiers, internal production details,
private chat transcripts, or material copied from another private repository. Summarize only the generic technical context needed for upstream work.

## Work register

`docs/work-register.json` is canonical. `docs/work-register.md` is the human-readable projection.
Every entry needs:

- stable work ID;
- type and concise problem statement;
- scope (`upstream` or `fork-local`) and upstream disposition;
- issue, PR, branch, and commit references;
- current status and evidence date;
- validation or known gap;
- next action.

Fork-local work uses `upstreamDisposition: no-pr-planned` and must not leak into an
upstream feature PR. Closed, superseded, and abandoned work stays recorded. Never reuse
work IDs.
