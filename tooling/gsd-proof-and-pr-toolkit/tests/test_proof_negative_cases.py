"""Negative regressions for verify_proof_manifest.py. Each case must FAIL closed
(nonzero exit, verdict FAIL or UNKNOWN). A green result for any of these is a bug."""
import json, hashlib, subprocess, tempfile, pathlib, unittest, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "verify_proof_manifest.py"


def sha(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.repo = self.tmp / "repo"
        self.repo.mkdir()
        git = lambda *a: subprocess.run(["git", *a], cwd=self.repo, check=True, capture_output=True)
        git("init", "-q")
        (self.repo / "a.ts").write_text("export const a = 1;\n")
        git("add", "a.ts")
        git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init")
        self.manifest = self.tmp / "manifest.json"
        self.good = {"schema": 1, "head": subprocess.run(["git", "rev-parse", "HEAD"], cwd=self.repo, capture_output=True, text=True).stdout.strip(),
                     "sourceHashes": {"a.ts": sha(self.repo / "a.ts")},
                     "commands": [{"command": "pnpm test", "exitCode": 0}],
                     "logs": {}}

    def write(self, obj):
        self.manifest.write_text(json.dumps(obj))

    def run_script(self):
        out = subprocess.run([sys.executable, str(SCRIPT), str(self.manifest), str(self.repo)], capture_output=True, text=True)
        try:
            res = json.loads(out.stdout or "{}")
        except json.JSONDecodeError:
            res = {"verdict": "UNPARSEABLE", "raw": out.stdout}
        return out.returncode, res

    def assertFailsClosed(self, code, res):
        self.assertNotEqual(code, 0, res)
        self.assertIn(res.get("verdict"), {"FAIL", "UNKNOWN"}, res)


class EmptyAndSchema(Base):
    def test_empty_manifest_is_not_a_pass(self):
        self.write({"schema": 1, "sourceHashes": {}, "commands": [], "logs": {}})
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_missing_schema_version_fails(self):
        obj = dict(self.good); obj.pop("schema")
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_no_commands_fails(self):
        obj = dict(self.good); obj["commands"] = []
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_malformed_json_is_unknown_not_crash_pass(self):
        self.manifest.write_text("{not json")
        code, res = self.run_script()
        self.assertFailsClosed(code, res)


class HeadAndDrift(Base):
    def test_head_mismatch_is_stale(self):
        obj = dict(self.good); obj["head"] = "0" * 40
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)
        self.assertEqual(res.get("verdict"), "FAIL")

    def test_staged_change_after_proof_is_stale(self):
        (self.repo / "a.ts").write_text("export const a = 9;\n")
        subprocess.run(["git", "add", "a.ts"], cwd=self.repo, check=True)
        self.write(self.good)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_unstaged_change_after_proof_is_stale(self):
        (self.repo / "a.ts").write_text("export const a = 9;\n")
        self.write(self.good)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)


class LogsAndTests(Base):
    def test_failed_command_exit_is_fail(self):
        obj = dict(self.good); obj["commands"] = [{"command": "pnpm test", "exitCode": 1}]
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_signal_or_timeout_is_fail(self):
        obj = dict(self.good); obj["commands"] = [{"command": "pnpm test", "exitCode": None, "signal": "SIGKILL"}]
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_missing_log_file_fails(self):
        obj = dict(self.good); obj["logs"] = {"tap": "does-not-exist.log"}
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_log_hash_mismatch_fails(self):
        log = self.tmp / "t.log"; log.write_text("ok 1\n")
        obj = dict(self.good); obj["logs"] = {"tap": {"path": str(log), "sha256": "00" * 32}}
        self.write(obj)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)


class GitHygiene(Base):
    def test_staged_forbidden_artifact_fails(self):
        (self.repo / "node_modules").mkdir()
        (self.repo / "node_modules" / "x.js").write_text("x")
        subprocess.run(["git", "add", "-f", "node_modules/x.js"], cwd=self.repo, check=True)
        self.write(self.good)
        code, res = self.run_script()
        self.assertFailsClosed(code, res)

    def test_whitespace_error_fails_diff_check(self):
        # Hash is recomputed from the modified file, so ONLY the whitespace check can fail.
        (self.repo / "a.ts").write_text("export const a = 1;   \n")
        self.write(dict(self.good, sourceHashes={"a.ts": sha(self.repo / "a.ts")}))
        code, res = self.run_script()
        self.assertFailsClosed(code, res)
        checks = [f["check"] for f in res.get("failures", [])]
        self.assertIn("diff-check-unstaged", checks, res)
        self.assertNotIn("source-hash", checks, res)

    def test_cached_whitespace_error_fails_too(self):
        (self.repo / "a.ts").write_text("export const a = 1;   \n")
        subprocess.run(["git", "add", "a.ts"], cwd=self.repo, check=True)
        self.write(dict(self.good, sourceHashes={"a.ts": sha(self.repo / "a.ts")}))
        code, res = self.run_script()
        self.assertFailsClosed(code, res)


class GitErrors(Base):
    def test_not_a_git_repo_is_unknown_not_pass(self):
        plain = self.tmp / "plain"; plain.mkdir()
        (plain / "a.ts").write_text("export const a = 1;\n")
        self.write(dict(self.good, sourceHashes={"a.ts": sha(plain / "a.ts")}))
        out = subprocess.run([sys.executable, str(SCRIPT), str(self.manifest), str(plain)], capture_output=True, text=True)
        self.assertNotEqual(out.returncode, 0)


if __name__ == "__main__":
    unittest.main()
