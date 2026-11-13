---
name: gsd-proof-and-pr-toolkit
description: Verify a GSD proof manifest against the working tree and drive a bounded PR check and Copilot-review poll with compact output. Use before committing proof-backed work and when working a PR through review.
---

# GSD proof and PR toolkit

Three scripts replace hand-typed hash, TAP, dependency, and gh-polling one-liners.

## verify_proof_manifest.py

Use before any commit of proof-backed work.

    python3 scripts/verify_proof_manifest.py MANIFEST.json REPO_ROOT

Checks each `sourceHashes` entry against the working tree, runs `git diff --check`, and flags untracked `node_modules/`, `.gsd/exec/`, temp, or `.DS_Store` paths. Prints one JSON verdict. Exit 0 only on PASS.

Verdicts: `PASS` (exit 0), `FAIL` (a check is violated, exit 1), `UNKNOWN` (evidence missing or malformed, exit 2). Any non-PASS blocks staging. Read `failures[]`. Each entry has a `check` and one of two shapes:

- `items` list: `source-hash`, `staged-forbidden`, `untracked-forbidden`, `command`, `log`, `source-path`.
- `detail` string: `diff-check-unstaged`, `diff-check-cached`.

`UNKNOWN` and `stale head` carry a top-level `error` instead of `failures`. Treat any object without `verdict: PASS` as blocking.

`PASS` means manifest consistency only (`evidence_level: manifest-only`). It does NOT prove that a command ran, that a log came from it, or that every relevant input is listed. Execution evidence needs a separate, trusted recorder.

## gh_pr_copilot_loop.py

Use when waiting on CI and reviews.

    python3 scripts/gh_pr_copilot_loop.py OWNER/REPO PR --timeout 900

Polls checks until none are pending, or the timeout passes. Prints one JSON object with the overall status, failing and pending check names, and only the unresolved review threads, bodies truncated to 300 characters. It never prints raw logs.

Read the open threads, then reply and resolve each one only after verifying the fix on the current head.

## Rules

- Run the tests in `tests/` after any change to these scripts.
- Never mark a thread resolved that you did not verify on the current commit.
- Never stage `node_modules`, temp output, or `.gsd/exec/` files.

## dependency_doctor.py

Run first on any new worktree, after a branch switch that changes dependencies, and on any module or type error. Also run it when the same build error repeats.

    python3 scripts/dependency_doctor.py WORKTREE [@scope/pkg ...] --json

Read-only: it never installs, builds, deletes, or imports runtime modules. It reports per package a dependency status (READY, MISSING_INSTALL, FOREIGN_WORKSPACE, MISSING_BUILD) and a separate freshness (FRESH is never claimed; STALE only when a source file is newer than its output, otherwise UNKNOWN).

Package identity comes from `package.json` `name`, not from the directory. `gsd-agent-core` is the directory; `@gsd/agent-core` is the package.

Exit 0 means only that the checked dependency conditions hold. It is not build proof and not a claim that the code is correct. Check dependency provenance before editing source to clear a resolution or type error.

