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


class BoundedCalls(unittest.TestCase):
    """Regression: every gh call carries a timeout, and a hung call returns UNKNOWN, not a hang."""
    def test_fetch_checks_passes_a_timeout(self):
        import subprocess as sp
        seen = {}
        def fake(args, **kw):
            seen["timeout"] = kw.get("timeout")
            raise sp.TimeoutExpired(args, kw.get("timeout"))
        orig = sp.run
        sp.run = fake
        try:
            with self.assertRaises(RuntimeError):
                loop.fetch_checks("r/r", 1)
        finally:
            sp.run = orig
        self.assertIsNotNone(seen.get("timeout"), "gh call has no timeout")



class CommandSemantics(unittest.TestCase):
    """Real CLI behaviour: `gh pr checks` exits 8 for pending; codes 1/2/4 are failures.
    Each test drives the public entrypoint with a faked gh process and checks the
    structured result and exit code, not an internal exception."""

    def _fake(self, rc, stdout="", stderr=""):
        import subprocess as sp, types
        def run(args, **kw):
            return types.SimpleNamespace(returncode=rc, stdout=stdout, stderr=stderr)
        return run

    def _main(self, fake_run, argv=("r/r", "3")):
        import subprocess as sp, io, contextlib, json as js
        orig = sp.run
        sp.run = fake_run
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                rc = loop.main_with_args(list(argv)) if hasattr(loop, "main_with_args") else None
        finally:
            sp.run = orig
        return rc, buf.getvalue()

    def test_checks_exit8_pending_is_parsed_not_error(self):
        import json as js
        data = js.dumps([{"name": "build", "state": "PENDING"}])
        checks = loop.parse_checks_result(8, data, "")
        self.assertEqual(loop.overall(checks), "PENDING")

    def test_checks_exit0_success_parses(self):
        import json as js
        data = js.dumps([{"name": "build", "state": "SUCCESS"}])
        self.assertEqual(loop.overall(loop.parse_checks_result(0, data, "")), "PASS")

    def test_checks_auth_error_exit4_is_not_success(self):
        with self.assertRaises(RuntimeError) as cm:
            loop.parse_checks_result(4, "", "gh auth login required")
        self.assertIn("auth", str(cm.exception).lower())

    def test_checks_generic_failure_exit1_is_error_not_pass(self):
        with self.assertRaises(RuntimeError):
            loop.parse_checks_result(1, "", "network down")

    def test_garbage_json_on_exit0_is_error_not_pass(self):
        with self.assertRaises(RuntimeError):
            loop.parse_checks_result(0, "<html>", "")

    def test_empty_list_on_exit0_is_unknown_not_pass(self):
        checks = loop.parse_checks_result(0, "[]", "")
        self.assertEqual(loop.overall(checks), "UNKNOWN")

    def test_unknown_state_is_not_pass(self):
        checks = loop.parse_checks_result(0, '[{"name":"x","state":"WEIRD"}]', "")
        self.assertNotEqual(loop.overall(checks), "PASS")

    def test_missing_state_field_is_structured_error_not_pass(self):
        # A malformed entry is a contract violation: the parser raises instead of guessing.
        with self.assertRaises(RuntimeError):
            loop.parse_checks_result(0, '[{"name":"x"}]', "")

    def test_pending_wins_over_failure_is_not_silent_pass(self):
        import json as js
        data = js.dumps([{"name": "a", "state": "FAILURE"}, {"name": "b", "state": "PENDING"}])
        self.assertIn(loop.overall(loop.parse_checks_result(8, data, "")), {"FAILURE", "PENDING"})


class PublicInterface(unittest.TestCase):
    """Drive main() as the CLI does: stdout must be one JSON object, exit code must match."""

    def _run_main(self, argv, fake_checks=None, fake_threads=None, sleep_log=None):
        import io, contextlib, json as js
        orig_fc, orig_ft, orig_sleep = loop.fetch_checks, loop.fetch_threads, loop.time.sleep
        if fake_checks is not None:
            loop.fetch_checks = fake_checks
        if fake_threads is not None:
            loop.fetch_threads = fake_threads
        if sleep_log is not None:
            loop.time.sleep = lambda s: sleep_log.append(s)
        buf = io.StringIO()
        old_argv = sys.argv
        sys.argv = ["gh_pr_copilot_loop.py", *argv]
        try:
            with contextlib.redirect_stdout(buf):
                rc = loop.main()
        finally:
            sys.argv = old_argv
            loop.fetch_checks, loop.fetch_threads, loop.time.sleep = orig_fc, orig_ft, orig_sleep
        return rc, js.loads(buf.getvalue() or "{}")

    def test_timeout_is_structured_unknown_with_nonzero_exit(self):
        def boom(repo, pr):
            raise RuntimeError("gh pr checks timed out after 60s")
        rc, out = self._run_main(["r/r", "1"], fake_checks=boom)
        self.assertNotEqual(rc, 0)
        self.assertEqual(out.get("status"), "UNKNOWN")
        self.assertIn("timed out", out.get("error", ""))

    def test_invalid_json_is_structured_error(self):
        def bad(repo, pr):
            return loop.parse_checks_result(0, "<html>", "")
        rc, out = self._run_main(["r/r", "1"], fake_checks=bad)
        self.assertNotEqual(rc, 0)
        self.assertEqual(out.get("status"), "UNKNOWN")

    def test_incomplete_threads_response_is_not_pass(self):
        ok = lambda repo, pr: [{"name": "build", "state": "SUCCESS"}]
        def bad_threads(repo, pr):
            raise RuntimeError("graphql: missing data")
        rc, out = self._run_main(["r/r", "1"], fake_checks=ok, fake_threads=bad_threads)
        self.assertNotEqual(rc, 0)
        self.assertNotEqual(out.get("status"), "PASS")
        self.assertIn("graphql", out.get("error", ""))

    def test_clean_pass_exits_zero(self):
        ok = lambda repo, pr: [{"name": "build", "state": "SUCCESS"}]
        rc, out = self._run_main(["r/r", "1"], fake_checks=ok, fake_threads=lambda r, p: [])
        self.assertEqual(rc, 0)
        self.assertEqual(out.get("status"), "PASS")

    def test_total_wait_never_exceeds_deadline(self):
        # Use a fake clock: a sleep advances the clock, as it does in real time.
        # Pending forever with a 10-second budget must end with total sleep <= 10 s.
        import types
        clock = {"t": 1000.0}
        sleeps = []
        def fake_sleep(s):
            sleeps.append(s)
            clock["t"] += s
        fake_time = types.SimpleNamespace(monotonic=lambda: clock["t"], sleep=fake_sleep)
        pending = lambda repo, pr: [{"name": "build", "state": "PENDING"}]
        orig_time = loop.time
        loop.time = fake_time
        try:
            rc, out = self._run_main(["r/r", "1", "--timeout", "10"], fake_checks=pending,
                                     fake_threads=lambda r, p: [])
        finally:
            loop.time = orig_time
        self.assertLessEqual(sum(sleeps), 10.0 + 1e-6, sleeps)
        self.assertGreater(len(sleeps), 0)
        self.assertEqual(out.get("status"), "PENDING")
        self.assertNotEqual(rc, 0)


class GraphQLContract(unittest.TestCase):
    """Real GraphQL failure shapes must produce a structured UNKNOWN, never a traceback or PASS.
    These drive fetch_threads through the real _gh path with a fake subprocess."""

    def _with_gh(self, rc, stdout, stderr=""):
        import subprocess as sp, types
        orig = sp.run
        sp.run = lambda args, **kw: types.SimpleNamespace(returncode=rc, stdout=stdout, stderr=stderr)
        return orig

    def _restore(self, orig):
        import subprocess as sp
        sp.run = orig

    def _expect_unknown(self, rc, stdout):
        import io, contextlib, json as js, sys as _s
        orig_fc = loop.fetch_checks
        loop.fetch_checks = lambda r, p: [{"name": "build", "state": "SUCCESS"}]
        orig_run = self._with_gh(rc, stdout)
        buf = io.StringIO(); old_argv = _s.argv
        _s.argv = ["x", "r/r", "1"]
        try:
            with contextlib.redirect_stdout(buf):
                code = loop.main()
        finally:
            _s.argv = old_argv
            self._restore(orig_run)
            loop.fetch_checks = orig_fc
        out = js.loads(buf.getvalue())  # must be one parseable JSON object
        self.assertEqual(out["status"], "UNKNOWN", out)
        self.assertNotEqual(code, 0)

    def test_graphql_html_body_is_structured_unknown(self):
        self._expect_unknown(0, "<html>")

    def test_graphql_empty_object_is_structured_unknown(self):
        self._expect_unknown(0, "{}")

    def test_graphql_repository_null_is_structured_unknown(self):
        self._expect_unknown(0, '{"data":{"repository":null}}')

    def test_graphql_comments_null_is_structured_unknown(self):
        self._expect_unknown(0, '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[{"id":"a","isResolved":false,"path":"x","line":1,"comments":null}],"pageInfo":{"hasNextPage":false}}}}}}')

    def test_graphql_thread_missing_id_is_structured_unknown(self):
        self._expect_unknown(0, '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[{"isResolved":false}],"pageInfo":{"hasNextPage":false}}}}}}')

    def test_graphql_non_boolean_isResolved_is_structured_unknown(self):
        self._expect_unknown(0, '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[{"id":"open","isResolved":"false"}],"pageInfo":{"hasNextPage":false}}}}}}')

    def test_graphql_missing_pageinfo_is_structured_unknown(self):
        self._expect_unknown(0, '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[]}}}}}')

    def test_graphql_more_pages_is_not_pass(self):
        # 100 threads all resolved but hasNextPage=true: completeness is not proven -> not PASS.
        nodes = ",".join('{"id":"t%d","isResolved":true,"path":"x","line":1,"comments":{"nodes":[{"body":"ok"}]}}' % i for i in range(100))
        self._expect_unknown(0, '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[%s],"pageInfo":{"hasNextPage":true}}}}}}' % nodes)

    def test_graphql_nonzero_exit_is_structured_unknown(self):
        self._expect_unknown(1, "")


class DeadlineBudget(unittest.TestCase):
    """Fake clock: every gh call costs time. The total must stay within timeout + one in-flight call."""

    def test_no_extra_calls_start_after_the_budget_expires(self):
        import types, io, contextlib, json as js, sys as _s
        clock = {"t": 0.0}
        call_cost = 59.9
        starts = []
        def fake_sleep(sec):
            clock["t"] += sec
        fake_time = types.SimpleNamespace(monotonic=lambda: clock["t"], sleep=fake_sleep)
        def checks(repo, pr):
            starts.append(("checks", clock["t"]))
            clock["t"] += call_cost
            return [{"name": "build", "state": "PENDING"}]
        def threads(repo, pr):
            starts.append(("threads", clock["t"]))
            clock["t"] += call_cost
            return []
        orig_time, orig_fc, orig_ft = loop.time, loop.fetch_checks, loop.fetch_threads
        loop.time, loop.fetch_checks, loop.fetch_threads = fake_time, checks, threads
        buf = io.StringIO(); old = _s.argv
        _s.argv = ["x", "r/r", "1", "--timeout", "10"]
        try:
            with contextlib.redirect_stdout(buf):
                rc = loop.main()
        finally:
            _s.argv = old
            loop.time, loop.fetch_checks, loop.fetch_threads = orig_time, orig_fc, orig_ft
        elapsed = clock["t"]
        # Worst case allowed: the budget plus at most one in-flight call (60 s).
        self.assertLessEqual(elapsed, 10 + 60 + 1e-6, (elapsed, starts))
        self.assertNotEqual(rc, 0)
        self.assertNotEqual(js.loads(buf.getvalue()).get("status"), "PASS")


class ThirdReviewBlockers(unittest.TestCase):
    """Regressions for the three blockers found in review. Each drives the public main()."""

    def _main(self, argv, checks_fn, threads_fn=None):
        import io, contextlib, json as js, sys as _s
        orig_fc, orig_ft = loop.fetch_checks, loop.fetch_threads
        loop.fetch_checks = checks_fn
        loop.fetch_threads = threads_fn or (lambda r, p: [])
        buf = io.StringIO(); old = _s.argv
        _s.argv = ["x", *argv]
        try:
            with contextlib.redirect_stdout(buf):
                rc = loop.main()
        finally:
            _s.argv = old
            loop.fetch_checks, loop.fetch_threads = orig_fc, orig_ft
        return rc, js.loads(buf.getvalue())

    def test_gh_missing_binary_is_structured_unknown_not_traceback(self):
        import subprocess as sp
        orig = sp.run
        def missing(args, **kw):
            raise FileNotFoundError("gh")
        sp.run = missing
        try:
            rc, out = self._main(["r/r", "1"], lambda r, p: loop.fetch_checks(r, p))
        finally:
            sp.run = orig
        self.assertEqual(out["status"], "UNKNOWN")
        self.assertNotEqual(rc, 0)

    def test_graphql_oserror_is_structured_unknown(self):
        import subprocess as sp, types
        orig = sp.run
        def fake(args, **kw):
            if "graphql" in args:
                raise FileNotFoundError("gh")
            return types.SimpleNamespace(returncode=0, stdout='[{"name":"b","state":"SUCCESS"}]', stderr="")
        sp.run = fake
        try:
            rc, out = self._main(["r/r", "1"], lambda r, p: loop.parse_checks_result(0, '[{"name":"b","state":"SUCCESS"}]', ""), threads_fn=loop.fetch_threads)
        finally:
            sp.run = orig
        self.assertEqual(out["status"], "UNKNOWN")
        self.assertNotEqual(rc, 0)

    def test_no_gh_call_starts_after_deadline_even_when_success(self):
        import types
        clock = {"t": 0.0}
        starts = []
        fake_time = types.SimpleNamespace(monotonic=lambda: clock["t"], sleep=lambda s: clock.__setitem__("t", clock["t"] + s))
        def checks(r, p):
            starts.append(("checks", clock["t"])); clock["t"] += 59.9
            return [{"name": "b", "state": "SUCCESS"}]
        def threads(r, p):
            starts.append(("threads", clock["t"])); clock["t"] += 59.9
            return []
        orig_time = loop.time; loop.time = fake_time
        try:
            rc, out = self._main(["r/r", "1", "--timeout", "10"], checks, threads)
        finally:
            loop.time = orig_time
        self.assertLessEqual(clock["t"], 10 + 60 + 1e-6, starts)
        # The GraphQL call may not start once the budget is already spent.
        self.assertNotIn("threads", [s[0] for s in starts if s[1] >= 10], starts)

    def test_huge_timeout_is_structured_error_not_overflow(self):
        rc, out = self._main(["r/r", "1", "--timeout", "9" * 401], lambda r, p: [{"name": "b", "state": "SUCCESS"}])
        self.assertNotEqual(rc, 0)
        self.assertIn("timeout", out.get("error", "").lower())


if __name__ == "__main__":
    unittest.main()
