"""Type and contract regressions for verify_proof_manifest.py. Each case must not PASS."""
import json, hashlib, subprocess, tempfile, pathlib, unittest, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "verify_proof_manifest.py"

class Contract(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.repo = self.tmp / "repo"; self.repo.mkdir()
        g = lambda *a: subprocess.run(["git", *a], cwd=self.repo, check=True, capture_output=True)
        g("init", "-q"); (self.repo / "a.ts").write_text("x\n"); g("add", "a.ts")
        g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "i")
        self.head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=self.repo, capture_output=True, text=True).stdout.strip()
        self.good = {"schema": 1, "head": self.head,
                     "sourceHashes": {"a.ts": hashlib.sha256(b"x\n").hexdigest()},
                     "commands": [{"command": "true", "exitCode": 0}], "logs": {}}
        self.m = self.tmp / "m.json"

    def run_with(self, obj):
        self.m.write_text(json.dumps(obj))
        p = subprocess.run([sys.executable, str(SCRIPT), str(self.m), str(self.repo)], capture_output=True, text=True)
        try:
            res = json.loads(p.stdout or "{}")
        except json.JSONDecodeError:
            res = {"verdict": "NO_JSON", "raw": p.stdout}
        return p.returncode, res, p.stderr

    def assertNotPass(self, obj):
        code, res, err = self.run_with(obj)
        self.assertNotEqual(res.get("verdict"), "PASS", (res, err))
        self.assertNotEqual(code, 0, (res, err))
        self.assertIn(res.get("verdict"), {"FAIL", "UNKNOWN"}, (res, err))

class MissingSourceBypass(Contract):
    def test_missing_source_with_null_hash_is_not_pass(self):
        # Regression for the reviewed bypass: null expected digest + absent file used to PASS.
        obj = dict(self.good, sourceHashes={"gone.ts": None})
        self.assertNotPass(obj)

    def test_missing_source_with_valid_digest_is_not_pass(self):
        # Targets the missing-source branch directly: a well-typed digest, absent file.
        # Without the null-type gate this is the branch a mutant would have to pass through.
        obj = dict(self.good, sourceHashes={"gone.ts": "0" * 64})
        code, res, err = self.run_with(obj)
        self.assertNotEqual(res.get("verdict"), "PASS", (res, err))
        self.assertIn("gone.ts", json.dumps(res), res)

class StrictTypes(Contract):
    def test_boolean_exit_code_is_not_pass(self):
        self.assertNotPass(dict(self.good, commands=[{"command": "true", "exitCode": False}]))

    def test_string_exit_code_is_not_pass(self):
        self.assertNotPass(dict(self.good, commands=[{"command": "true", "exitCode": "0"}]))

    def test_non_hex_digest_is_not_pass(self):
        self.assertNotPass(dict(self.good, sourceHashes={"a.ts": "not-hex"}))

    def test_list_sources_is_unknown_not_crash(self):
        self.assertNotPass(dict(self.good, sourceHashes=["a.ts"]))

    def test_log_path_non_string_is_structured_not_crash(self):
        self.assertNotPass(dict(self.good, logs={"tap": {"path": 7}}))

class SourceConfinement(Contract):
    def test_parent_traversal_source_is_not_pass(self):
        outside = self.tmp / "outside.ts"; outside.write_text("x\n")
        digest = hashlib.sha256(b"x\n").hexdigest()
        self.assertNotPass(dict(self.good, sourceHashes={"../outside.ts": digest}))

    def test_absolute_source_is_not_pass(self):
        outside = self.tmp / "abs.ts"; outside.write_text("x\n")
        digest = hashlib.sha256(b"x\n").hexdigest()
        self.assertNotPass(dict(self.good, sourceHashes={str(outside): digest}))

class Evidence(Contract):
    def test_empty_logs_object_alone_is_not_execution_evidence(self):
        # Documented limit: PASS is manifest consistency, not execution proof.
        # This test pins the contract: PASS without any declared output digest is
        # reported with a `evidence_level` of "manifest-only", never as execution proof.
        code, res, _ = self.run_with(self.good)
        if res.get("verdict") == "PASS":
            self.assertEqual(res.get("evidence_level"), "manifest-only", res)

if __name__ == "__main__":
    unittest.main()
