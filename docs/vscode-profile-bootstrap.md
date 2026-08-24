<!-- markdownlint-disable MD013 -->

# VS Code Profile Bootstrap

## Decision

Use a dedicated empty VS Code Profile named `GSD Pi Contributor` for all GSD Pi contribution
worktrees.

This is the least error-prone current VS Code architecture because profiles isolate settings,
extensions, MCP servers, and user-scoped instruction/prompt files while following the user
across folders and worktrees. Feature branches therefore remain clean and contain only
upstream-safe changes.

The profile complements rather than replaces the governance anchor:

| Layer | Authority | Contents |
| --- | --- | --- |
| Feature worktree | Current `upstream/main` plus one contribution | Source, tests, generated output, and upstream-safe docs only |
| Governance anchor | `origin/docs/copilot-workspace-governance` | Agent contract, workflow, work register, rationale, bootstrap references |
| `GSD Pi Contributor` profile | Local VS Code runtime | Minimal bootstrap instruction, `/workspace-init`, GitHub MCP, Context7, settings, extensions |

A VS Code Profile is configuration isolation, not a sandbox. The bootstrap must still verify
repository/remotes and stop when the profile is used outside `pimmink/gsd-pi`.

## Create and open

VS Code officially supports opening a folder with a named profile:

```bash
code ../gsd-pi-<slug> --profile "GSD Pi Contributor"
```

If the profile does not exist, current VS Code creates a new empty profile. Prefer an empty
profile so unrelated MCP servers, instructions, and extensions are not inherited. Do not mark
GSD Pi-specific extensions as applying to all profiles.

The local profile was created with VS Code `1.133.0`. Future worktrees should use the command
above. Use Settings Sync only if deliberately synchronizing this profile to another trusted
machine; do not assume extensions synchronize into remote SSH or dev-container contexts.

## Extensions

Install only the non-built-in contribution extensions:

```bash
code --profile "GSD Pi Contributor" --install-extension biomejs.biome
code --profile "GSD Pi Contributor" --install-extension editorconfig.editorconfig
```

Copilot Chat is built into the current VS Code installation. Do not recommend or install old
Marketplace Copilot packages that attempt to downgrade the built-in extension.

## Profile settings

Keep profile settings small:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "chat.tools.terminal.autoApprove": false,
  "files.exclude": {
    "**/.cache": true,
    "**/dist": true,
    "**/dist-test": true
  },
  "search.exclude": {
    "**/.cache": true,
    "**/dist": true,
    "**/dist-test": true,
    "**/node_modules": true
  }
}
```

Repository configuration remains authoritative when it intentionally overrides formatting or
validation behavior.

## Profile MCP configuration

With the profile active, run **MCP: Open User Configuration** and use:

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

Official VS Code behavior is that user-profile MCP servers are available across workspaces
opened with that profile, and each profile can have its own MCP configuration. This is why the
runtime configuration belongs in the dedicated profile rather than every feature worktree.

Prefer OAuth for GitHub. Never store a resolved PAT or credential in profile documentation,
tracked files, shell history, or chat. The governance branch `.vscode/mcp.json` remains the
tracked reference and config for the anchor workspace only.

## Minimal profile instruction

With the profile active, use `/instructions` and create a **User** instruction named
`GSD Pi Contributor Bootstrap`. It should be always applicable and contain only bootstrap
rules, not a copy of the full `AGENTS.md`:

```markdown
- Confirm this is a `pimmink/gsd-pi` checkout with `upstream=open-gsd/gsd-pi` and
  `origin=pimmink/gsd-pi`; otherwise stop.
- Treat current upstream policy and maintainer direction as authoritative.
- Before planning/editing, read `AGENTS.md`, `docs/contributor-workflow.md`, and canonical
  `docs/work-register.json` from `/Users/pimmink/Klanten/gsd-pi-pimmink/worktrees/workspace-governance`.
- Keep feature worktrees based on fetched `upstream/main`; never copy fork-local governance
  into an upstream contribution branch.
- Preserve unknown dirty work and keep private/customer context out of the public fork.
- Search existing issues/PRs first; never create an issue or perform a GitHub write without
  explicit authorization.
- Use GitHub MCP first.
- Use targeted checks, then `verify:fast`, then `verify:pr` as needed; reserve
  `verify:merge` for the stable merge/review checkpoint required by current upstream policy.
- Read `package.json#engines` and `packageManager` as toolchain truth.
```

The installed local instruction includes these rules with fuller safety wording. Because it
is profile-scoped, it does not affect unrelated VS Code projects unless the profile is
incorrectly selected; the repository/remotes preflight detects that mistake.

## Profile-scoped initialization prompt

Create a User prompt named `workspace-init` in the same profile. It must remain read-only and:

1. verify repository, remotes, branch, status, and toolchain declarations;
2. read current upstream policy;
3. consult the governance anchor and canonical work register;
4. refresh selected issue/PR/check/review state using GitHub MCP first;
5. report drift and ask which registered work item to continue;
6. avoid edits, installs, branch switches, commits, pushes, and GitHub writes.

The tracked source is `.github/prompts/workspace-init.prompt.md` on the governance branch.
Keep the profile copy aligned with that source.

## Governance anchor workspace

`gsd-pi.code-workspace` is the governance/anchor workspace only. It provides anchor-local
settings and recommendations; it is not copied to or required by feature worktrees. The
workspace may retain tracked `.vscode/mcp.json` as reference and for anchor use.

## Maintenance

When governance changes:

1. edit and validate the governance anchor;
2. update the tracked bootstrap/template documentation;
3. update the local profile instruction or prompt through VS Code while that profile is
   active;
4. validate the register and publish only to the governance branch;
5. open a clean test folder with `--profile "GSD Pi Contributor"` and confirm the profile
   exposes only the intended MCP servers and extensions.

Do not depend on VS Code's internal hashed profile directory names in portable scripts. Use
the profile UI and official `--profile` CLI selector; internal paths are implementation
details.

## Official references

- Profiles: <https://code.visualstudio.com/docs/configure/profiles>
- Select a profile from the CLI: <https://code.visualstudio.com/docs/editor/command-line#_select-a-profile>
- MCP server scopes: <https://code.visualstudio.com/docs/copilot/customization/mcp-servers>
- User and workspace instruction files: <https://code.visualstudio.com/docs/copilot/customization/custom-instructions>
