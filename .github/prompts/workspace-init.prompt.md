---
agent: 'agent'
description: 'Initialize a clean GSD Pi feature worktree without modifying it'
---

<!-- markdownlint-disable MD013 -->

# Initialize this GSD Pi contribution worktree

Remain read-only. Do not edit files, install dependencies, switch branches, commit, push,
or perform GitHub writes.

1. Verify the repository and remotes: `upstream` must be `open-gsd/gsd-pi` and `origin`
   must be `pimmink/gsd-pi`.
2. Read current upstream `CONTRIBUTING.md`, `VISION.md`, and relevant repository guidance.
3. Read fork-local governance from `/Users/pimmink/Klanten/gsd-pi-workspace-governance`:
   `AGENTS.md`, `docs/contributor-workflow.md`, and canonical
   `docs/work-register.json`.
4. Run bounded read-only checks: branch/status, worktree list, remotes, recent commits,
   `package.json#engines`, `packageManager`, and work-register validation from the governance
   anchor.
5. Use GitHub MCP first to refresh the selected register item's issue/PR/head/check/review
   state and search for overlapping current issues or PRs. Do not write to GitHub.
6. Report workspace health, upstream-policy implications, register drift, blockers, and the
   narrowest safe next action.

End with one question asking which registered item to continue. Do not start implementation
until the user chooses.
