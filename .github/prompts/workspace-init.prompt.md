---
agent: 'agent'
description: 'Initialize the gsd-pi contributor workspace and refresh current work context'
---

<!-- markdownlint-disable MD013 -->

# Initialize the GSD Pi contributor workspace

Operate read-only until the final question. Do not edit source, commit, push, create or
change GitHub issues/PRs, install dependencies, or expose secrets during initialization.

## Read first

1. `AGENTS.md`
2. `CONTRIBUTING.md`
3. `docs/contributor-workflow.md`
4. `docs/work-register.json`
5. `docs/work-register.md`

Treat `docs/work-register.json` as canonical and Markdown as its projection.

## Verify local state

Run bounded, read-only checks:

```bash
git status --short --branch
git remote -v
git fetch --prune upstream
git fetch --prune origin
git worktree list
git log -5 --oneline --decorate
node --version
pnpm --version
node scripts/validate-work-register.mjs
```

Do not switch branches when the working tree is dirty or another process uses the checkout.

## Refresh GitHub context

Use GitHub MCP first. Read current state for every active upstream item in the register,
including issues, PR state, head SHA, checks, review decision, and latest maintainer feedback.
A bounded `gh` read is allowed if MCP cannot return a compact result.

Also search for newly opened PRs or issues authored by `pimmink` that are missing from the
register. Do not perform any GitHub write.

## Detect drift

Compare GitHub and Git evidence with the register. Report:

- stale status, PR, issue, branch, or commit references;
- open checks or review blockers;
- local branches already merged or superseded upstream;
- fork-local items accidentally marked for upstream contribution;
- upstream items without an issue or PR;
- dirty or concurrently used worktrees;
- generated files changed without their generator source.

If the register is stale, propose the exact register changes but do not apply them until asked.

## Response format

Return a concise initialization report with these headings:

1. **Workspace health** — branch, cleanliness, remotes, toolchain, register validation.
2. **Active upstream work** — issue/PR, head SHA, checks, review state, next action.
3. **Fork-local work** — status and why no upstream PR is planned.
4. **Drift or blockers** — concrete mismatches only.
5. **Recommended focus** — one evidence-backed recommendation.

End with one structured question asking which registered work item to continue. Do not begin
implementation until the user chooses.
