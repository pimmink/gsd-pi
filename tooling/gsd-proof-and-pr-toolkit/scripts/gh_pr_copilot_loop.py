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
    if not checks:
        return "UNKNOWN"
    states = {c.get("state") for c in checks}
    if states & FAILED:
        return "FAILURE"
    if states & PENDING:
        return "PENDING"
    if states - ({"SUCCESS", "SKIPPED", "NEUTRAL"} | KNOWN_STATES):
        return "UNKNOWN"
    if states - {"SUCCESS", "SKIPPED", "NEUTRAL"}:
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
    except OSError as err:
        raise RuntimeError(f"gh could not be executed: {err}") from err
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip()[:300] or f"gh exit {res.returncode}")
    return res.stdout


# Exit codes documented for `gh pr checks`: 0 = all checks ok, 8 = some checks pending.
# Any other non-zero exit is an error (1 generic, 2 cancelled, 4 authentication).
CHECKS_OK_CODES = {0, 8}
KNOWN_STATES = {"SUCCESS", "FAILURE", "PENDING", "QUEUED", "IN_PROGRESS", "WAITING",
                "SKIPPED", "NEUTRAL", "CANCELLED", "TIMED_OUT", "ERROR", "ACTION_REQUIRED",
                "STALE", "STARTUP_FAILURE"}


def parse_checks_result(returncode, stdout, stderr):
    """Interpret one `gh pr checks --json name,state` result. Command-specific on purpose."""
    if returncode not in CHECKS_OK_CODES:
        if returncode == 4 or "auth" in (stderr or "").lower() and "login" in (stderr or "").lower():
            raise RuntimeError("gh authentication required (exit 4): run gh auth login")
        raise RuntimeError(f"gh pr checks failed (exit {returncode}): {(stderr or '').strip()[:200]}")
    try:
        checks = json.loads(stdout or "")
    except json.JSONDecodeError as err:
        raise RuntimeError(f"gh pr checks returned unparseable output: {err}") from err
    if not isinstance(checks, list):
        raise RuntimeError("gh pr checks output is not a list")
    for c in checks:
        if not isinstance(c, dict) or not isinstance(c.get("state"), str) or not isinstance(c.get("name"), str):
            raise RuntimeError("gh pr checks entry missing name or state")
    return checks


def fetch_checks(repo, pr):
    try:
        res = subprocess.run(["gh", "pr", "checks", str(pr), "-R", repo, "--json", "name,state"],
                             capture_output=True, text=True, timeout=GH_TIMEOUT)
    except subprocess.TimeoutExpired as err:
        raise RuntimeError(f"gh pr checks timed out after {GH_TIMEOUT}s") from err
    except OSError as err:
        raise RuntimeError(f"gh could not be executed: {err}") from err
    return parse_checks_result(res.returncode, res.stdout, res.stderr)

class ThreadEvidence(RuntimeError):
    """Review-thread evidence is missing, malformed, or incomplete. Never PASS on this."""


def fetch_threads(repo, pr):
    """Return all review threads for the PR, or raise ThreadEvidence.

    Refuses to return a partial page: if pageInfo says more pages exist, the
    result is incomplete and the caller must not conclude PASS from it.
    """
    if not isinstance(repo, str) or repo.count("/") != 1:
        raise ThreadEvidence("repository must be OWNER/NAME")
    owner, name = repo.split("/", 1)
    query = ('query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p)'
             '{reviewThreads(first:100){pageInfo{hasNextPage} nodes{id isResolved path line '
             'comments(first:1){nodes{body}}}}}}}')
    try:
        raw = _gh(["api", "graphql", "-f", f"query={query}", "-F", f"o={owner}",
                   "-F", f"n={name}", "-F", f"p={pr}"])
    except RuntimeError as err:
        raise ThreadEvidence(str(err)) from err
    try:
        data = json.loads(raw or "")
    except json.JSONDecodeError as err:
        raise ThreadEvidence(f"graphql returned unparseable output: {err}") from err
    try:
        threads = data["data"]["repository"]["pullRequest"]["reviewThreads"]
        nodes = threads["nodes"]
        has_next = threads["pageInfo"]["hasNextPage"]
    except (KeyError, TypeError) as err:
        raise ThreadEvidence(f"graphql response missing expected fields: {err}") from err
    if not isinstance(nodes, list) or not isinstance(has_next, bool):
        raise ThreadEvidence("graphql response has wrong types for nodes or hasNextPage")
    if has_next:
        raise ThreadEvidence("more than one page of review threads: completeness not established")
    out = []
    for n in nodes:
        if not isinstance(n, dict) or not isinstance(n.get("id"), str) or not isinstance(n.get("isResolved"), bool):
            raise ThreadEvidence("review thread missing id or boolean isResolved")
        comments = n.get("comments")
        comment_nodes = comments.get("nodes") if isinstance(comments, dict) else None
        if comment_nodes is None or not isinstance(comment_nodes, list):
            raise ThreadEvidence("review thread comments malformed")
        first = comment_nodes[0] if comment_nodes and isinstance(comment_nodes[0], dict) else {}
        out.append({"id": n["id"], "isResolved": n["isResolved"], "path": n.get("path"),
                    "line": n.get("line"), "body": first.get("body", "") or ""})
    return out


POLL_INTERVAL = 30  # seconds between checks while pending
MIN_SLEEP = 1.0     # do not start a poll cycle with less than this left


def _emit(result, rc):
    print(json.dumps(result))
    return rc


def main() -> int:
    """Public CLI. Always prints exactly one JSON object and returns a matching exit code.
    Exit 0 only for PASS with no open review threads. Everything else is non-zero."""
    if len(sys.argv) < 3:
        return _emit({"status": "UNKNOWN", "error": "usage: REPO PR [--timeout S]"}, 2)
    repo, pr = sys.argv[1], sys.argv[2]
    try:
        timeout = int(sys.argv[sys.argv.index("--timeout") + 1]) if "--timeout" in sys.argv else 900
    except (IndexError, ValueError):
        return _emit({"status": "UNKNOWN", "error": "--timeout needs an integer number of seconds"}, 2)
    if not (1 <= timeout <= 86400):
        return _emit({"status": "UNKNOWN", "error": "--timeout must be between 1 and 86400 seconds"}, 2)
    deadline = time.monotonic() + timeout
    try:
        if time.monotonic() >= deadline:
            return _emit({"status": "UNKNOWN", "error": "deadline already reached before first check"}, 1)
        checks = fetch_checks(repo, pr)
        # Sleep only the time left before the deadline; never overshoot the total budget.
        # Stop when less than MIN_SLEEP remains: a sleep of a few microseconds would
        # spin thousands of polls near the deadline instead of ending the wait.
        while overall(checks) == "PENDING":
            remaining = deadline - time.monotonic()
            if remaining < MIN_SLEEP:
                break
            time.sleep(min(POLL_INTERVAL, remaining))
            if time.monotonic() >= deadline:
                break  # budget is spent: do not start another gh call
            checks = fetch_checks(repo, pr)
        status = overall(checks)
        if time.monotonic() >= deadline and status != "UNKNOWN":
            # Budget is spent: report what we have; do not start the GraphQL call.
            return _emit({"status": "PENDING" if status == "PENDING" else "UNKNOWN",
                          "pending": [c["name"] for c in checks if c.get("state") in PENDING],
                          "open_threads": [],
                          "error": "deadline reached before review threads could be fetched"}, 1)
        if status == "PENDING" and time.monotonic() >= deadline:
            return _emit({"status": "PENDING", "pending": [c["name"] for c in checks if c.get("state") in PENDING],
                          "open_threads": [], "error": "deadline reached while checks pending"}, 1)
        threads = compact_threads(fetch_threads(repo, pr))
    except RuntimeError as err:
        return _emit({"status": "UNKNOWN", "error": str(err)}, 1)
    except (KeyError, TypeError, ValueError, AttributeError) as err:
        return _emit({"status": "UNKNOWN", "error": f"unexpected response shape: {type(err).__name__}"}, 1)
    result = {"status": status,
              "failing": [c["name"] for c in checks if c.get("state") in FAILED],
              "pending": [c["name"] for c in checks if c.get("state") in PENDING],
              "open_threads": threads}
    if status == "PASS" and not threads:
        return _emit(result, 0)
    return _emit(result, 1)


if __name__ == "__main__":
    sys.exit(main())
