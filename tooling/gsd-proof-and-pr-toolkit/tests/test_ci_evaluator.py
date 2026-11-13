"""False-PASS regressions for the CI evaluator. Pure JSON fixtures, no network.
Every case must NOT produce PASS unless all required evidence is present and terminal."""
import unittest, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import ci_evaluator as ev

HEAD = "0427ff5614498c7f61c78724e2fc6ae6c6982343"
OLD = "3da77973f47197e0ac4c480f2e36938d312c4aeb"
REQ = ["native-attended (macOS)"]

def run(**kw):
    base = dict(pr_head=HEAD, pr_repo="open-gsd/gsd-pi", required=REQ,
                check_runs=[{"name": "native-attended (macOS)", "status": "completed",
                             "conclusion": "success", "head_sha": HEAD, "run_id": 1, "run_attempt": 1,
                             "event": "pull_request"}],
                pages_complete=True, api_error=None, required_config_ok=True)
    base.update(kw)
    return ev.evaluate(**base)

class FalsePass(unittest.TestCase):
    def test_happy_path_is_pass(self):
        self.assertEqual(run()["verdict"], "PASS")

    def test_empty_check_list_is_not_pass(self):
        self.assertNotEqual(run(check_runs=[])["verdict"], "PASS")

    def test_wrong_head_is_not_pass(self):
        r = run(check_runs=[{"name": "native-attended (macOS)", "status": "completed", "conclusion": "success", "head_sha": OLD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}])
        self.assertNotEqual(r["verdict"], "PASS")

    def test_missing_required_job_is_not_pass(self):
        r = run(check_runs=[{"name": "fast-gates", "status": "completed", "conclusion": "success", "head_sha": HEAD, "run_id": 2, "run_attempt": 1, "event": "pull_request"}])
        self.assertNotEqual(r["verdict"], "PASS")
        self.assertIn("native-attended (macOS)", r["missing"])

    def test_incomplete_pagination_is_not_pass(self):
        self.assertNotEqual(run(pages_complete=False)["verdict"], "PASS")

    def test_api_error_is_unknown_not_pass(self):
        r = run(api_error="HTTP 403")
        self.assertEqual(r["verdict"], "UNKNOWN")

    def test_old_green_attempt_does_not_beat_newer_red(self):
        old = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "success", "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}
        new = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "failure", "head_sha": HEAD, "run_id": 1, "run_attempt": 2, "event": "pull_request"}
        self.assertNotEqual(run(check_runs=[old, new])["verdict"], "PASS")

    def test_pending_is_not_pass(self):
        r = run(check_runs=[{"name": "native-attended (macOS)", "status": "in_progress", "conclusion": None, "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}])
        self.assertEqual(r["verdict"], "PENDING")

    def test_cancelled_is_not_pass(self):
        r = run(check_runs=[{"name": "native-attended (macOS)", "status": "completed", "conclusion": "cancelled", "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}])
        self.assertEqual(r["verdict"], "FAILURE")

    def test_unknown_required_config_is_unknown(self):
        self.assertEqual(run(required_config_ok=False)["verdict"], "UNKNOWN")

    def test_skipped_required_job_is_not_pass(self):
        r = run(check_runs=[{"name": "native-attended (macOS)", "status": "completed", "conclusion": "skipped", "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}])
        self.assertNotEqual(r["verdict"], "PASS")

if __name__ == "__main__":
    unittest.main()

class NewestAttemptTie(unittest.TestCase):
    """Regression: two runs with the same attempt number must not let success win."""
    def test_equal_attempt_success_then_newer_failure_is_not_pass(self):
        ok = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "success", "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}
        bad = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "failure", "head_sha": HEAD, "run_id": 2, "run_attempt": 1, "event": "pull_request"}
        r = run(check_runs=[ok, bad])
        self.assertNotEqual(r["verdict"], "PASS", r)

    def test_equal_attempt_failure_then_newer_success_is_not_pass_by_order(self):
        # Order of the API list must not decide; with a tie we cannot prove recency -> UNKNOWN.
        ok = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "success", "head_sha": HEAD, "run_id": 2, "run_attempt": 1, "event": "pull_request"}
        bad = {"name": "native-attended (macOS)", "status": "completed", "conclusion": "failure", "head_sha": HEAD, "run_id": 1, "run_attempt": 1, "event": "pull_request"}
        r = run(check_runs=[bad, ok])
        self.assertNotEqual(r["verdict"], "PASS", r)

