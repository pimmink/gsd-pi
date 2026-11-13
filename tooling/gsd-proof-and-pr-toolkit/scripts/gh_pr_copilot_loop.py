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
    return "PASS"

def compact_threads(threads):
    out = []
    for t in threads:
        if t.get("isResolved"):
            continue
        out.append({"id": t["id"], "path": t.get("path"), "line": t.get("line"),
                    "body": (t.get("body") or "")[:BODY_LIMIT]})
    return out

def fetch_checks(repo, pr):
    res = subprocess.run(["gh", "pr", "checks", str(pr), "-R", repo, "--json", "name,state"],
                         capture_output=True, text=True)
    return json.loads(res.stdout or "[]")

def fetch_threads(repo, pr):
    owner, name = repo.split("/", 1)
    query = ('query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p)'
             '{reviewThreads(first:100){nodes{id isResolved path line comments(first:1){nodes{body}}}}}}}')
    res = subprocess.run(["gh", "api", "graphql", "-f", f"query={query}", "-F", f"o={owner}",
                          "-F", f"n={name}", "-F", f"p={pr}"], capture_output=True, text=True)
    nodes = json.loads(res.stdout or "{}")["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]
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
