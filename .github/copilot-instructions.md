<!-- markdownlint-disable MD013 -->

# GitHub Copilot Instructions

This checkout is the fork-local governance anchor, not an upstream feature worktree.
Read and follow repository [`AGENTS.md`](../AGENTS.md) before planning or editing. Also read:

- current upstream [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`VISION.md`](../VISION.md);
- [`docs/contributor-workflow.md`](../docs/contributor-workflow.md);
- canonical [`docs/work-register.json`](../docs/work-register.json);
- [`docs/vscode-profile-bootstrap.md`](../docs/vscode-profile-bootstrap.md).

Use `.github/prompts/workspace-init.prompt.md` as the tracked source for the dedicated
`GSD Pi Contributor` profile's `/workspace-init` prompt.

Key constraints:

- Current upstream policy and maintainer direction are authoritative for acceptance.
- This is a public-contribution fork. Never introduce customer/private context, credentials,
  private assets, private cloud identifiers, or copied private-repository instructions.
- Base feature work on current `upstream/main`; isolate one concern per branch/worktree/PR.
- Search existing issues and PRs first. Do not assume every contribution needs a new issue,
  but obey current upstream issue/RFC/ADR requirements. Never create an issue without
  explicit authorization.
- Preserve dirty work. Never reset, clean, stash, delete, or overwrite unknown changes.
- Keep governance and work-register changes on `docs/copilot-workspace-governance`; never
  copy them into an upstream feature PR.
- Use GitHub MCP first. Every GitHub write requires explicit authorization.
- Use targeted checks, `verify:fast`, and `verify:pr` during development. Reserve
  `verify:merge` for the stable merge/review checkpoint required by current upstream policy.
- Read `package.json#engines` and `packageManager` as toolchain truth.
