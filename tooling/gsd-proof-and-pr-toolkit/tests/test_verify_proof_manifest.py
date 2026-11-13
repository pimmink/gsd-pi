import json, hashlib, subprocess, tempfile, pathlib, unittest, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "verify_proof_manifest.py"

def sha(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


def mismatch_paths(res):
    """Source-hash drift paths, from the structured failures list."""
    for f in res.get("failures", []):
        if f.get("check") == "source-hash":
            return [i["path"] for i in f["items"]]
    return []


def failure_checks(res):
    return [f.get("check") for f in res.get("failures", [])]

class VerifyProofManifest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.repo = self.tmp / "repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q"], cwd=self.repo, check=True)
        (self.repo / "a.ts").write_text("export const a = 1;\n")
        subprocess.run(["git", "add", "a.ts"], cwd=self.repo, check=True)
        subprocess.run(["git", "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"], cwd=self.repo, check=True)
        self.manifest = self.tmp / "manifest.json"
        head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=self.repo, capture_output=True, text=True).stdout.strip()
        self.manifest.write_text(json.dumps({"schema": 1, "head": head, "sourceHashes": {"a.ts": sha(self.repo / "a.ts")},
                                             "commands": [{"command": "pnpm test", "exitCode": 0}], "logs": {}}))

    def run_script(self):
        out = subprocess.run([sys.executable, str(SCRIPT), str(self.manifest), str(self.repo)], capture_output=True, text=True)
        return out.returncode, json.loads(out.stdout or "{}")

    def test_pass_when_hashes_match_and_tree_is_clean(self):
        code, res = self.run_script()
        self.assertEqual(code, 0)
        self.assertEqual(res["verdict"], "PASS", res)

    def test_fail_when_a_source_changed(self):
        (self.repo / "a.ts").write_text("export const a = 2;\n")
        code, res = self.run_script()
        self.assertNotEqual(code, 0)
        self.assertEqual(res["verdict"], "FAIL")
        self.assertIn("a.ts", mismatch_paths(res), res)

    def test_fail_on_untracked_node_modules_or_temp_files(self):
        (self.repo / "node_modules").mkdir()
        (self.repo / "node_modules" / "x.js").write_text("x")
        code, res = self.run_script()
        self.assertNotEqual(code, 0)
        self.assertIn("untracked-forbidden", failure_checks(res), res)

    def test_fail_when_a_missing_source_is_not_flagged(self):
        head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=self.repo, capture_output=True, text=True).stdout.strip()
        self.manifest.write_text(json.dumps({"schema": 1, "head": head, "sourceHashes": {"gone.ts": "00"},
                                             "commands": [{"command": "pnpm test", "exitCode": 0}], "logs": {}}))
        code, res = self.run_script()
        self.assertNotEqual(code, 0)
        self.assertIn("gone.ts", mismatch_paths(res), res)

if __name__ == "__main__":
    unittest.main()
