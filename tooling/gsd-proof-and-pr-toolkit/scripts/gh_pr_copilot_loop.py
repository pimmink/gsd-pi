#!/usr/bin/env python3
"""Bounded PR status + Copilot review poll with compact output.

Usage: gh_pr_copilot_loop.py REPO PR_NUMBER [--timeout SECONDS]

Polls `gh pr checks` until nothing is pending or the timeout passes, then
prints one JSON object: overall status, failing checks, and only the UNRESOLVED
review threads, with bodies truncated. Never dumps raw logs.
"""
import json, subprocess, sys, time

BODY_LIMIT = 300
PENDING = {"PENDING", "QUEUED", "IN_PROGRESS", "WAITING"}
FAILED = {"FAILURE", "CANCELLED", "TIMED_OUT", "ERROR", "ACTION_REQUIRED"}

def overall(checks):
    states = {c["state"] for c in checks}
    if states & FAILED:
        return "FAILURE"
    if states & PENDING:
        return "PENDING"
    if not checks:
        return "UNKNOWN"
    return "PASS"

def compact_threads(threads):
    out = []
    for t in threads:
        if t.get("isResolved"):
            continue
        out.append({"id": t["id"], "path": t.get("path"), "line": t.get("line"),
                    "body": (t.get("body") or "")[:BODY_LIMIT]})
    return out

GH_TIMEOUT = 60  # seconds per gh call; a hung call must not hang the poll


def _gh(args):
    """Run gh with a timeout. Any failure raises RuntimeError: never an empty PASS."""
    try:
        res = subprocess.run(["gh", *args], capture_output=True, text=True, timeout=GH_TIMEOUT)
    except subprocess.TimeoutExpired as err:
        raise RuntimeError(f"gh timed out after {GH_TIMEOUT}s: {' '.join(args[:3])}") from err
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip()[:300] or f"gh exit {res.returncode}")
    return res.stdout


def fetch_checks(repo, pr):
    return json.loads(_gh(["pr", "checks", str(pr), "-R", repo, "--json", "name,state"]) or "[]")

def fetch_threads(repo, pr):
    owner, name = repo.split("/", 1)
    query = ('query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p)'
             '{reviewThreads(first:100){nodes{id isResolved path line comments(first:1){nodes{body}}}}}}}')
    out = _gh(["api", "graphql", "-f", f"query={query}", "-F", f"o={owner}",
               "-F", f"n={name}", "-F", f"p={pr}"])
    nodes = json.loads(out or "{}")["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]
    for n in nodes:
        n["body"] = (n.get("comments", {}).get("nodes") or [{}])[0].get("body", "")
    return nodes

def main() -> int:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "usage: REPO PR [--timeout S]"})); return 2
    repo, pr = sys.argv[1], sys.argv[2]
    timeout = int(sys.argv[sys.argv.index("--timeout") + 1]) if "--timeout" in sys.argv else 900
    deadline = time.monotonic() + timeout
    checks = fetch_checks(repo, pr)
    while overall(checks) == "PENDING" and time.monotonic() < deadline:
        time.sleep(30)
        checks = fetch_checks(repo, pr)
    status = overall(checks)
    result = {"status": status,
              "failing": [c["name"] for c in checks if c["state"] in FAILED],
              "pending": [c["name"] for c in checks if c["state"] in PENDING],
              "open_threads": compact_threads(fetch_threads(repo, pr))}
    print(json.dumps(result))
    return 0 if status == "PASS" and not result["open_threads"] else 1

if __name__ == "__main__":
    sys.exit(main())
