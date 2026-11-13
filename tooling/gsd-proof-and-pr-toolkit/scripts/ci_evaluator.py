#!/usr/bin/env python3
"""Fail-closed CI evaluator for one PR head.

Pure evaluation over JSON-shaped inputs (see evaluate()). The CLI at the bottom
fetches check runs through `gh api` with pagination and feeds evaluate().

Verdicts:
  PASS     every required check ran on the expected head, completed with success,
           pagination is complete, and the required set is known
  PENDING  a required check exists on the head but has not completed
  FAILURE  a required check completed with a non-success conclusion, or the newest
           attempt of a required check failed
  UNKNOWN  evidence is incomplete: API error, incomplete pages, missing required
           set, required job absent from the head, or unknown required config

Rules that protect against false PASS:
  - an empty check list is never PASS
  - a check on a different head SHA does not count
  - the NEWEST attempt decides; an old green attempt never overrides a newer failure
  - skipped or cancelled required checks are not PASS
  - an absent required job is listed as missing and blocks PASS
"""
import json, subprocess, sys

TERMINAL_OK = {"success"}
TERMINAL_BAD = {"failure", "cancelled", "timed_out", "action_required", "stale", "startup_failure"}


def _newest_by_name(check_runs, head_sha):
    """Return (newest_per_name, ambiguous_names).

    Recency is proven only by run_attempt. When two entries for the same check
    share the highest attempt number, recency is not provable: the name is reported
    as ambiguous rather than letting list order or a success decide.
    """
    by_name = {}
    for c in check_runs:
        if c.get("head_sha") != head_sha:
            continue
        by_name.setdefault(c["name"], []).append(c)
    newest, ambiguous = {}, []
    for name, entries in by_name.items():
        top = max((e.get("run_attempt") or 0) for e in entries)
        tops = [e for e in entries if (e.get("run_attempt") or 0) == top]
        if len(tops) > 1:
            ambiguous.append(name)
            continue
        newest[name] = tops[0]
    return newest, ambiguous


def evaluate(*, pr_head, pr_repo, required, check_runs, pages_complete, api_error, required_config_ok):
    if api_error:
        return {"verdict": "UNKNOWN", "reason": f"api error: {api_error}"}
    if not pages_complete:
        return {"verdict": "UNKNOWN", "reason": "incomplete pagination"}
    if not required_config_ok:
        return {"verdict": "UNKNOWN", "reason": "required-check configuration unknown"}
    if not required:
        return {"verdict": "UNKNOWN", "reason": "empty required set is not evidence"}
    if not check_runs:
        return {"verdict": "UNKNOWN", "reason": "no check runs returned", "missing": list(required)}

    newest, ambiguous = _newest_by_name(check_runs, pr_head)
    if any(r in ambiguous for r in required):
        return {"verdict": "UNKNOWN", "reason": "ambiguous attempts on expected head; recency not provable",
                "ambiguous": [r for r in required if r in ambiguous], "head": pr_head}
    missing = [r for r in required if r not in newest]
    if missing:
        return {"verdict": "UNKNOWN", "reason": "required job absent on expected head",
                "missing": missing, "head": pr_head}

    failing, pending, skipped = [], [], []
    for name in required:
        c = newest[name]
        status, conclusion = c.get("status"), c.get("conclusion")
        if status != "completed":
            pending.append(name)
        elif conclusion in TERMINAL_OK:
            continue
        elif conclusion == "skipped":
            skipped.append(name)
        elif conclusion in TERMINAL_BAD or conclusion is None:
            failing.append(name)
        else:
            failing.append(name)

    if failing:
        return {"verdict": "FAILURE", "failing": failing, "head": pr_head}
    if pending:
        return {"verdict": "PENDING", "pending": pending, "head": pr_head}
    if skipped:
        return {"verdict": "UNKNOWN", "reason": "required job skipped; skip is not platform coverage",
                "skipped": skipped, "head": pr_head}
    return {"verdict": "PASS", "head": pr_head, "required": list(required)}


def _gh_json(args):
    res = subprocess.run(["gh", *args], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip()[:300] or f"gh exit {res.returncode}")
    return json.loads(res.stdout or "null")


def main(argv):
    if len(argv) != 3:
        print(json.dumps({"verdict": "UNKNOWN", "reason": "usage: REPO PR_NUMBER REQUIRED_JSON_FILE"}))
        return 2
    repo, pr, req_file = argv
    try:
        required = json.load(open(req_file))
        if not isinstance(required, list) or not all(isinstance(x, str) for x in required):
            raise ValueError("required file must be a JSON list of check names")
        pr_obj = _gh_json(["api", f"repos/{repo}/pulls/{pr}"])
        head = pr_obj["head"]["sha"]
        runs, pages_ok = [], True
        page = 1
        while True:
            data = _gh_json(["api", f"repos/{repo}/commits/{head}/check-runs?per_page=100&page={page}"])
            batch = data.get("check_runs", [])
            runs.extend({"name": r["name"], "status": r["status"], "conclusion": r.get("conclusion"),
                         "head_sha": head, "run_attempt": r.get("run_attempt") or 1,
                         "run_id": r.get("id")} for r in batch)
            if len(batch) < 100:
                break
            page += 1
            if page > 50:
                pages_ok = False
                break
        result = evaluate(pr_head=head, pr_repo=repo, required=required, check_runs=runs,
                          pages_complete=pages_ok, api_error=None, required_config_ok=True)
    except (RuntimeError, ValueError, KeyError, json.JSONDecodeError) as err:
        result = {"verdict": "UNKNOWN", "reason": f"evaluator input error: {err}"}
    print(json.dumps(result))
    return {"PASS": 0}.get(result["verdict"], 1)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
