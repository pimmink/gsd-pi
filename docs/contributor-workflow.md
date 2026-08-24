<!-- markdownlint-disable MD013 -->

# Contributor Workflow

This workflow is for development in the `pimmink/gsd-pi` fork with upstream PRs to
`open-gsd/gsd-pi`. Current upstream policy is authoritative for upstream acceptance;
`AGENTS.md` in the governance anchor is the binding fork-local agent contract.

## Architecture

Use three intentionally separate layers:

1. **Feature worktree** — clean upstream-safe code and the contribution only, based on
   fetched `upstream/main`.
2. **Governance anchor** — tracked fork-local control-plane on
   `docs/copilot-workspace-governance` at
   `/Users/pimmink/Klanten/gsd-pi-pimmink/worktrees/workspace-governance`.
3. **VS Code Profile** — local runtime configuration named `GSD Pi Contributor`, shared by
   every GSD Pi feature worktree but not by unrelated projects.

Do not copy governance files into feature branches. See
[`vscode-profile-bootstrap.md`](vscode-profile-bootstrap.md) for profile setup and rationale.

## Open a workspace

Open a clean feature worktree directly with the dedicated profile:

```bash
code ../gsd-pi-<slug> --profile "GSD Pi Contributor"
```

VS Code officially supports `--profile`; if the named profile does not exist, the CLI
creates an empty one. The profile is exclusively for GSD Pi contribution work. Its bootstrap
instruction verifies repository/remotes and stops if the profile is used elsewhere.

Use `gsd-pi.code-workspace` only for the governance anchor itself. Feature worktrees do not
need that file or any tracked `.vscode` governance configuration. Run the profile-scoped
`/workspace-init` prompt before selecting implementation work.

Before coding:

```bash
git remote -v
git fetch --prune upstream
git fetch --prune origin
git status --short --branch
git config --get user.name
git config --get user.email
node -p "require('./package.json').engines"
node -p "require('./package.json').packageManager"
```

Expected identity:

```text
Pim Immink
pimmink@users.noreply.github.com
```

Treat `package.json#engines` and `packageManager` as toolchain truth. Do not duplicate their
versions in governance documentation.

## Select or create work

1. Search current upstream issues, PRs, and code first.
2. Check the canonical register in the governance anchor.
3. Use or claim an existing relevant issue when current upstream policy requires it.
4. Current upstream `CONTRIBUTING.md` requires an issue first for new features and permits
   obvious bug fixes to skip one. Report that requirement before implementation.
5. Core or architectural changes must follow current RFC, ADR, and maintainer-approval
   requirements.
6. Never create a new issue, claim an issue, or perform another GitHub write without explicit
   authorization.
7. Create one branch/worktree per concern from current `upstream/main`:

```bash
git worktree add ../gsd-pi-<slug> -b <type>/<slug> upstream/main
```

Use a suitable Conventional Commit branch prefix such as `fix/`, `feat/`, `docs/`, `test/`,
or `refactor/`. An issue is not mechanically required for every branch; follow the current
upstream rule for the specific contribution.

## Maintain the work register

`docs/work-register.json` is canonical, but it exists only in the governance anchor. From a
feature worktree, never add or copy the register into the contribution branch.

When branch, issue, PR, commit, status, checks, validation, or next action changes:

```bash
cd /Users/pimmink/Klanten/gsd-pi-pimmink/worktrees/workspace-governance
# Edit docs/work-register.json first, then its Markdown projection.
node scripts/validate-work-register.mjs
```

Publish register changes only to `origin/docs/copilot-workspace-governance`. Keep
`docs/work-register.md` synchronized as the human-readable projection. Evidence must come
from current GitHub state and local Git, not memory alone.

Fork-local entries use `scope: fork-local` and
`upstreamDisposition: no-pr-planned`. They never enter an upstream feature PR unless a
specific generic component is deliberately selected later as its own contribution.

## Implement

- Reproduce before fixing when practical.
- Fix the root cause, not only the observed symptom.
- Add regression coverage for resolved bugs.
- Keep generated files generator-owned.
- Keep one concern per commit and PR.
- Avoid unrelated formatting or generated churn.
- Update diagnostics when failure behavior changes.
- Preserve all unknown dirty work.

## Two-speed verification

The repository currently exposes these authoritative scripts in `package.json`:

- `verify:fast` — frozen install plus CI fast-gate scans and policy;
- `verify:pr` — fast broader loop: core build, extension typecheck, unit tests, and lifecycle
  shadow gate;
- `verify:merge` — full local parity with CI PR-blocking gates, implemented by
  `scripts/verify-merge.sh`.

### Development loop

Start with the narrowest useful feedback:

```bash
pnpm exec biome check --write <touched-files>
pnpm --filter <affected-package> typecheck
pnpm --filter <affected-package> test -- --run <relevant-suite>
```

Then escalate as needed:

```bash
pnpm run verify:fast
pnpm run verify:pr
```

Use `verify:pr` when changes cross packages or when targeted checks no longer provide enough
confidence. It is still a development-loop command and is substantially narrower than the
merge gate.

### Merge and review loop

When implementation and diff are stable:

1. Run relevant broader package, build, integration, packaging, native, or E2E checks.
2. Run `pnpm run verify:merge` before PR review when current upstream documentation requires
   full CI-blocking parity.
3. Record the exact command and result.
4. Push only after explicit authorization.
5. Treat GitHub CI as remote authority and investigate any difference from local results.

Do not rerun `verify:merge` after every small edit. Repeat it when later changes can invalidate
its evidence, including relevant changes to:

- source behavior or tests;
- dependencies or lockfiles;
- generated resources;
- build, packaging, release, or native code;
- CI workflows, gate scripts, or verification configuration;
- merge-conflict resolutions or rebases that alter the tested tree.

A documentation-only or metadata-only follow-up needs a repeat only when current upstream
policy requires it or the change affects a verified surface. If uncertain, rerun the narrower
relevant checks first and explain the risk-based decision.

### CI observability and clean-runner workflow

Treat slow or failing verification as an observability problem first, not a log-reading contest.

1. For `verify:pr`, `verify:merge`, and GitHub Actions failures, use `repo-actions-hub` and
   `pr-artifact-explorer` from the `GSD Pi Contributor` profile before manually digging through
   raw logs.
2. Use GitHub MCP or the GitHub PR extension to inspect check runs, per-job logs, and artifacts
   in context.
3. Once a branch is stable enough to push, prefer the sharded clean-runner flow from
   `/Users/pimmink/Klanten/gsd-pi-pimmink/ci/docs/remote-verification-guide.md` via
   `scripts/remote-verify.sh dispatch --mode sharded --source-ref <branch> --expected-sha <sha>`.
4. Fall back to `--mode stable` only when the sharded harness itself is under suspicion.
5. Report the slowest gate or failing job explicitly (`build:web-host`, `validate-pack`,
   `test:integration`, etc.) together with the run ID or URL instead of pasting only raw output.

Use the clean-runner signal to distinguish genuine regressions from local laptop contention
before spending time on local forensics.

## GitHub issue and PR flow

GitHub writes always require explicit authorization.

1. Use GitHub MCP first.
2. If MCP fails because its service or credential lacks access, record the exact failure.
3. Use `gh`-managed authentication only for the explicitly authorized fallback operation.
4. Push to `origin`; open upstream PRs against `open-gsd/gsd-pi:main`.
5. Link an issue only when one exists or upstream policy requires it.
6. Describe reproduction, root cause, changes, validation, risks, and remaining work.
7. Update the work register from the governance anchor.

Never force-push, merge, close, delete a remote branch, or rewrite history without a separate
explicit decision.

## MCP configuration

The dedicated `GSD Pi Contributor` profile owns runtime MCP configuration, so GitHub and
Context7 are available in every clean feature worktree without tracked files:

- `github`: official remote GitHub Copilot MCP endpoint; prefer OAuth;
- `context7`: current library documentation.

The governance branch keeps `.vscode/mcp.json` as a reference, bootstrap artifact, and anchor
workspace configuration. Do not copy it into a feature branch. Never track resolved tokens,
PATs, credentials, or populated environment files.

## Public and private boundary

The dedicated empty profile is safer than using the general VS Code profile because it does
not inherit unrelated customer MCP servers, instructions, settings, or extensions. It is not
a complete security boundary: always verify the active repository/remotes and inspect staged
content before committing.

Never place customer names, private assets, private cloud identifiers, production data,
credentials, private chat logs, private repository instructions, or private requirements in
the public fork.

## Cleanup

After a branch is merged or safely preserved remotely:

```bash
git worktree remove ../gsd-pi-<slug>
git worktree prune
```

Before deleting an old clone, preserve unique commits on a named recovery branch and export
meaningful dirty diffs. Dependencies and build caches are reproducible only after confirming
that no active process uses them.

## Official references

- VS Code Profiles: <https://code.visualstudio.com/docs/configure/profiles>
- VS Code CLI profiles: <https://code.visualstudio.com/docs/editor/command-line#_select-a-profile>
- VS Code MCP configuration: <https://code.visualstudio.com/docs/copilot/customization/mcp-servers>
- VS Code custom instructions: <https://code.visualstudio.com/docs/copilot/customization/custom-instructions>
