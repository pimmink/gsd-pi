<!-- markdownlint-disable MD013 -->

# GitHub Copilot Instructions

Read and follow repository [`AGENTS.md`](../AGENTS.md) before planning or editing.
Also read:

- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`docs/contributor-workflow.md`](../docs/contributor-workflow.md)
- [`docs/work-register.md`](../docs/work-register.md)
- [`docs/work-register.json`](../docs/work-register.json)

Key constraints:

- This is a public upstream-contribution fork. Do not introduce customer-specific context,
  credentials, private assets, or copied instructions from private repositories.
- Base work on current `upstream/main` and isolate one concern per branch/worktree/PR.
- Preserve unknown changes; never reset, clean, stash, or delete them automatically.
- Reproduce bugs and add regression tests.
- Keep generated files generator-owned.
- Use targeted validation during implementation and broader verification for cross-cutting,
  packaging, persistence, orchestration, authentication, model registry, or release changes.
- Update both work-register files whenever issue, PR, branch, commit, status, validation, or
  next action changes.
- GitHub MCP is primary. A `gh` fallback is allowed only after a demonstrated MCP access/tool
  failure and explicit authorization for that specific write.
- Never commit PATs or populated `.env` files.
