#!/usr/bin/env python3
"""Fail-closed verifier for a proof manifest against a git working tree.

Usage: verify_proof_manifest.py MANIFEST.json REPO_ROOT

Verdicts (exit 0 only on PASS):
  PASS     every check holds
  FAIL     a check is violated (drift, stale head, failed command, forbidden artifact)
  UNKNOWN  evidence is missing or unreadable (bad JSON, schema, no commands, git error)

Checks: schema version, non-empty source/command coverage, HEAD binding, source
hashes, staged + unstaged + cached `git diff --check`, forbidden staged or
untracked artifacts, command exit codes/signals, log file existence and sha256.
"""
import hashlib, json, pathlib, subprocess, sys

SCHEMA = 1
FORBIDDEN = ("node_modules/", ".gsd/exec/", "tmp/", ".DS_Store")


HEX64 = set("0123456789abcdef")


def is_digest(v):
    return isinstance(v, str) and len(v) == 64 and set(v) <= HEX64


def is_exit(v):
    # bool is a subclass of int in Python; a boolean exit code must never count as 0.
    return isinstance(v, int) and not isinstance(v, bool)


def safe_relpath(rel):
    """Repository-relative, no absolute, no parent traversal, no empty segments."""
    if not isinstance(rel, str) or not rel or rel.startswith("/"):
        return False
    parts = pathlib.PurePosixPath(rel).parts
    return ".." not in parts and "" not in parts and rel != "."


def sha256_file(path: pathlib.Path):
    if not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(repo, *args):
    return subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True)


def out(verdict, **kw):
    print(json.dumps({"verdict": verdict, **kw}))
    return {"PASS": 0, "FAIL": 1, "UNKNOWN": 2}[verdict]


def main(argv):
    if len(argv) != 2:
        return out("UNKNOWN", error="usage: MANIFEST REPO")
    mpath, repo = pathlib.Path(argv[0]), pathlib.Path(argv[1]).resolve()
    try:
        m = json.loads(mpath.read_text())
    except (OSError, json.JSONDecodeError) as err:
        return out("UNKNOWN", error=f"manifest unreadable: {err}")
    if not isinstance(m, dict):
        return out("UNKNOWN", error="manifest is not an object")
    if m.get("schema") != SCHEMA:
        return out("UNKNOWN", error=f"schema must be {SCHEMA}, got {m.get('schema')!r}")

    sources = m.get("sourceHashes") or {}
    commands = m.get("commands") or []
    if not isinstance(commands, list):
        return out("UNKNOWN", error="commands must be a list")
    if "logs" in m and m["logs"] is not None and not isinstance(m["logs"], dict):
        return out("UNKNOWN", error="logs must be an object")
    if not sources:
        return out("UNKNOWN", error="sourceHashes is empty: no input coverage")
    if not commands:
        return out("UNKNOWN", error="commands is empty: no command evidence")

    # Git identity. A non-git root or unreadable HEAD is UNKNOWN, never PASS.
    head = git(repo, "rev-parse", "HEAD")
    if head.returncode != 0:
        return out("UNKNOWN", error=f"git rev-parse failed: {head.stderr.strip()[:200]}")
    head_sha = head.stdout.strip()
    if m.get("head") != head_sha:
        return out("FAIL", error="stale head", manifest_head=m.get("head"), actual_head=head_sha)

    failures = []

    if not isinstance(sources, dict):
        return out("UNKNOWN", error="sourceHashes must be an object")
    mismatches = []
    for rel, expected in sources.items():
        if not safe_relpath(rel):
            return out("FAIL", failures=[{"check": "source-path", "items": [{"path": rel, "problem": "not repository-relative"}]}])
        if not is_digest(expected):
            mismatches.append({"path": rel, "expected": expected, "problem": "expected digest must be 64 lowercase hex"})
            continue
        target = repo / rel
        actual = sha256_file(target)
        if actual is None:
            mismatches.append({"path": rel, "expected": expected, "actual": None, "problem": "missing source"})
        elif actual != expected:
            mismatches.append({"path": rel, "expected": expected, "actual": actual})
    if mismatches:
        failures.append({"check": "source-hash", "items": mismatches})

    # Staged, unstaged and cached whitespace checks.
    ws = {
        "unstaged": git(repo, "diff", "--check"),
        "cached": git(repo, "diff", "--cached", "--check"),
    }
    for name, res in ws.items():
        if res.returncode != 0:
            failures.append({"check": f"diff-check-{name}", "detail": (res.stdout + res.stderr).strip()[:400]})

    # Staged and untracked forbidden artifacts.
    staged = git(repo, "diff", "--cached", "--name-only")
    if staged.returncode != 0:
        return out("UNKNOWN", error="git diff --cached failed")
    status = git(repo, "status", "--porcelain", "--untracked-files=all")
    if status.returncode != 0:
        return out("UNKNOWN", error="git status failed")
    bad_staged = [p for p in staged.stdout.splitlines() if any(p.startswith(f) or f in p for f in FORBIDDEN)]
    bad_untracked = [l[3:] for l in status.stdout.splitlines()
                     if l.startswith("??") and any(l[3:].startswith(f) or f in l[3:] for f in FORBIDDEN)]
    if bad_staged:
        failures.append({"check": "staged-forbidden", "items": bad_staged})
    if bad_untracked:
        failures.append({"check": "untracked-forbidden", "items": bad_untracked})

    # Command evidence: exit code must be 0, no signal, no timeout.
    cmd_bad = []
    for c in commands:
        if not isinstance(c, dict) or "command" not in c:
            return out("UNKNOWN", error="malformed command record", record=str(c)[:200])
        if not isinstance(c.get("command"), str) or not c["command"]:
            return out("UNKNOWN", error="command must be a non-empty string", record=str(c)[:200])
        if c.get("signal") or c.get("timedOut") or not is_exit(c.get("exitCode")) or c.get("exitCode") != 0:
            cmd_bad.append({"command": c["command"], "exitCode": c.get("exitCode"),
                            "signal": c.get("signal"), "timedOut": bool(c.get("timedOut"))})
    if cmd_bad:
        failures.append({"check": "command", "items": cmd_bad})

    # Logs: must exist, and when a hash is recorded it must match.
    log_bad = []
    for name, spec in (m.get("logs") or {}).items():
        if isinstance(spec, str):
            path, spec_digest = spec, None
        elif isinstance(spec, dict):
            path, spec_digest = spec.get("path"), spec.get("sha256")
        else:
            return out("UNKNOWN", error=f"log {name} must be a string or object")
        if not isinstance(path, str) or not path:
            return out("UNKNOWN", error=f"log {name} path must be a non-empty string")
        if spec_digest is not None and not is_digest(spec_digest):
            return out("UNKNOWN", error=f"log {name} sha256 must be 64 lowercase hex")
        lp = pathlib.Path(path)
        if not lp.is_absolute():
            lp = repo / lp
        digest = sha256_file(lp)
        if digest is None:
            log_bad.append({"log": name, "problem": "missing"})
        elif spec_digest is not None and spec_digest != digest:
            log_bad.append({"log": name, "problem": "hash-mismatch", "expected": spec_digest, "actual": digest})
    if log_bad:
        failures.append({"check": "log", "items": log_bad})

    if failures:
        return out("FAIL", failures=failures, checked_sources=len(sources), checked_commands=len(commands))
    return out("PASS", checked_sources=len(sources), checked_commands=len(commands), head=head_sha,
               evidence_level="manifest-only")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
