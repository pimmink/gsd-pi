<!-- markdownlint-disable MD013 -->

# Contributor Workflow

This workflow is for development in the `pimmink/gsd-pi` fork with upstream PRs to
`open-gsd/gsd-pi`. Repository `AGENTS.md` is the binding agent contract.

## Start a VS Code workspace

Open `gsd-pi.code-workspace` rather than a parent customer workspace. This prevents
private project instructions and MCP servers from leaking into public upstream work.
Run the reusable `/workspace-init` prompt from
`.github/prompts/workspace-init.prompt.md` before selecting implementation work.

Before coding:

```bash
git remote -v
git fetch --prune upstream
git fetch --prune origin
git status --short --branch
git config --get user.name
git config --get user.email
```

Expected identity:

```text
Pim Immink
pimmink@users.noreply.github.com
```

## Select or create work

1. Search upstream issues, PRs, and code first.
2. Add or update the item in `docs/work-register.json`.
3. Use an existing upstream issue when one describes the same problem.
4. Create a branch from current `upstream/main`:

```bash
git worktree add ../gsd-pi-<slug> -b <type>/<slug> upstream/main
```

Use Conventional Commit branch prefixes such as `fix/`, `feat/`, `docs/`, `test/`,
or `refactor/`.

## Implement

- Reproduce before fixing when practical.
- Fix the root cause, not the observed symptom only.
- Add regression coverage for every resolved bug.
- Keep generated files generator-owned.
- Keep one concern per commit and PR.
- Avoid unrelated formatting or generated churn.
- Update diagnostics when failure behavior changes.

## Validate

Use the smallest useful feedback loop first:

```bash
pnpm exec biome check --write <touched-files>
pnpm --filter <affected-package> typecheck
pnpm --filter <affected-package> test -- --run <relevant-suite>
```

Run broader verification when scope or risk requires it:

```bash
pnpm run build
pnpm run test
pnpm run verify:merge
```

A broad check is required for cross-package contracts, build or packaging changes,
model registry generation, database authority, workflow orchestration, authentication,
and release behavior.

## GitHub issue and PR flow

GitHub writes always require explicit authorization.

1. Use GitHub MCP first.
2. If MCP fails because its service or credential lacks access, record the exact failure.
3. Use `gh`-managed authentication only for the authorized fallback operation.
4. Push to `origin`; open the PR against `open-gsd/gsd-pi:main`.
5. Link the upstream issue and describe reproduction, root cause, changes, validation,
   risks, and remaining work.
6. Update both work-register files with PR number, commits, status, checks, and next action.

Never force-push, merge, close, or delete a remote branch without a separate decision.

## MCP configuration for VS Code

The tracked `.vscode/mcp.json` intentionally stays small:

- `github`: official remote GitHub Copilot MCP endpoint with OAuth handled by VS Code;
- `context7`: current library documentation lookup.

VS Code supports workspace `.vscode/mcp.json`, user-profile MCP configuration,
input variables, and environment files. Prefer OAuth and secure input variables over PATs.

If a local GitHub MCP server is required, put this only in user configuration or an
untracked local override:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "githubPat",
      "description": "GitHub PAT for local MCP fallback",
      "password": true
    }
  ],
  "servers": {
    "githubLocal": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:githubPat}"
      }
    }
  }
}
```

Never store the resolved input in a tracked file. The default remote GitHub server does
not require this PAT fallback.

## Maintaining the work register

Edit `docs/work-register.json` first. Set `scope` to `upstream` for intended
open-gsd contributions and `fork-local` for private fork workflow, recovery, or tooling.
Fork-local entries must use `upstreamDisposition: no-pr-planned` and stay out of upstream
feature PRs.

Keep statuses to:

- `idea`
- `investigating`
- `in-progress`
- `complete`
- `pr-open`
- `merged`
- `closed-unmerged`
- `superseded`
- `blocked`

Then update `docs/work-register.md` to match and validate the canonical source:

```bash
node scripts/validate-work-register.mjs
```

Evidence should come from GitHub state and local Git, not memory alone.

## Cleanup

After a branch is merged or safely preserved remotely:

```bash
git worktree remove ../gsd-pi-<slug>
git worktree prune
```

Before deleting an old clone, migrate unique commits to a named recovery branch and
export any meaningful dirty diff. Dependencies, `dist`, `dist-test`, coverage output,
and build caches are reproducible and may be deleted after confirming no active process
uses them.

## Sources

- VS Code MCP servers: <https://code.visualstudio.com/docs/copilot/chat/mcp-servers>
- VS Code MCP configuration reference: <https://code.visualstudio.com/docs/agents/reference/mcp-configuration>
- GitHub Copilot repository instructions: <https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot>
- Upstream contribution guide: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
