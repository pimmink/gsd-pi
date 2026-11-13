import json, pathlib, subprocess, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import gh_pr_copilot_loop as loop

class Summarize(unittest.TestCase):
    def test_pending_when_any_check_is_pending(self):
        checks = [{"name": "build", "state": "PENDING"}, {"name": "lint", "state": "SUCCESS"}]
        self.assertEqual(loop.overall(checks), "PENDING")

    def test_fail_when_any_check_failed(self):
        checks = [{"name": "build", "state": "FAILURE"}, {"name": "lint", "state": "SUCCESS"}]
        self.assertEqual(loop.overall(checks), "FAILURE")

    def test_skipped_and_success_is_pass(self):
        checks = [{"name": "build", "state": "SKIPPED"}, {"name": "lint", "state": "SUCCESS"}]
        self.assertEqual(loop.overall(checks), "PASS")

    def test_copilot_comments_are_compact_and_unresolved_only(self):
        threads = [
            {"id": "a", "isResolved": False, "path": "x.ts", "line": 3, "body": "A" * 900},
            {"id": "b", "isResolved": True, "path": "y.ts", "line": 1, "body": "done"},
        ]
        out = loop.compact_threads(threads)
        self.assertEqual([t["id"] for t in out], ["a"])
        self.assertLessEqual(len(out[0]["body"]), 300)

if __name__ == "__main__":
    unittest.main()
