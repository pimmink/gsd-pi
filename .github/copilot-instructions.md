# Copilot instructions

## Project

gsd-pi is a TypeScript-first monorepo for orchestrating AI coding agents. Reusable
packages live in `packages/`, product extensions in `src/resources/extensions/`,
the native engine in `native/`, and the VS Code extension in `vscode-extension/`.
Read `VISION.md` and `CONTRIBUTING.md` before making changes; the contribution
guidelines and current maintainer decisions take precedence over these notes.

## Scope and contribution rules

- Work only on the assigned issue and its acceptance criteria. Keep each change
  focused; avoid unrelated refactors, formatting churn, and new abstractions
  without clear user value.
- Check existing issues and pull requests first. Follow `CONTRIBUTING.md` for
  issue requirements, claiming, first-time contributions, and RFC/ADR approval.
  Do not create an issue or change issue state without explicit human direction.
  If the contribution requires an issue or maintainer approval that is missing,
  stop and report that prerequisite. For authorized assigned work, use Copilot's
  normal flow to open a pull request linked to its issue; never merge a pull
  request.
- Never commit directly to the default branch, change release/version surfaces
  for a feature fix, or open a pull request unrelated to the assigned work.
- Preserve generator-owned output by changing its source and using the documented
  generator instead of editing generated files by hand.
- Keep this public repository free of credentials, private project details,
  customer data, and local-only workspace or governance files.

## Work tracking and repository boundaries

- The fork's contributor work register is maintained on the separate
  `docs/copilot-workspace-governance` branch, not in feature branches. Its
  canonical JSON is
  [`docs/work-register.json`](https://github.com/pimmink/gsd-pi/blob/docs/copilot-workspace-governance/docs/work-register.json);
  its Markdown file is only a human-readable projection. If a task references
  a `GSD-W###` item, look up that exact ID in the JSON when the branch is
  accessible. If it is not accessible, say so and do not guess or recreate its
  status. Never copy governance files into a feature branch or update the
  register unless the task explicitly includes that work.
- Use the assigned task, relevant GitHub issues and pull requests, and any
  accessible exact work-register entry as context. Before changing code, inspect
  relevant linked issues and pull requests; do not infer implementation, review,
  or merge status from an issue alone.
- Keep any issue, pull request, commit, and validation references in the
  pull-request description or handoff accurate and limited to evidence actually
  verified in the repository or GitHub session. Report any register update that
  remains for the human contributor.
- This is a public contributor fork. Keep one assigned concern per branch and
  pull request, and keep fork-local governance work separate from upstream
  contributions. Never include private project context, private local paths,
  credentials, or private plans in a public change.

## Agents and delegation

- The repository-level `.github/agents/` directory is the source for any
  custom agent profiles available to a cloud session. Check which profiles are
  actually present on the task's base branch and offered by the current Copilot
  workflow. The contributor's `pim-local-gsd-*` agents and skills live in the
  separate local workspace, not in this repository, and are not automatically
  available to cloud sessions.
- Do not copy local `pim-local-gsd-*` profiles into this public repository:
  they rely on local paths, worktrees, tools, or private governance context.
  If a repository custom agent is available and directly relevant, follow its
  stated scope and tools; do not assume an unavailable agent ran or passed.
- Work directly for a bounded change or a single continuous investigation.
  Delegate only when the current Copilot workflow explicitly supports it and
  the work has genuinely independent parts. Give each delegated task a narrow
  scope, integrate its result, and verify the resulting change in the cloud
  environment. Do not delegate merely to add a review layer.

## Development and verification

- Use the Node.js and pnpm versions declared in the root `package.json`
  (`engines` and `packageManager`). The cloud setup workflow installs dependencies
  with `--ignore-scripts` to match CI; do not rerun installation without that flag
  unless the task requires dependency lifecycle scripts.
- Add or update tests close to behavior changes. Start with the narrowest relevant
  package or test command documented in `CONTRIBUTING.md`.
- Run `pnpm run verify:fast` for the fast repository checks. Use
  `pnpm run verify:pr` when the change needs broader build and unit-test
  coverage. Before requesting review, follow `CONTRIBUTING.md` to determine
  whether the full merge gate is required; do not claim an unavailable check
  passed.
- Report the exact checks run and their outcomes, including any checks skipped
  because the environment lacks required native tooling or resources.
- Match nearby code and documentation style. Avoid reformatting untouched files.
