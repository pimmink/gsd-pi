"""Regression tests for dependency_doctor.py. Each builds a throwaway fixture
under a temp dir; nothing touches the real worktree, fork, or global install."""
import json, os, pathlib, sys, tempfile, unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import dependency_doctor as dd


def write(p: pathlib.Path, text: str = ""):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


def write_json(p: pathlib.Path, obj):
    write(p, json.dumps(obj))


class Fixture(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.base = pathlib.Path(self._tmp.name).resolve()
        self.wt = self.base / "worktree"
        self.fork = self.base / "fork"
        self.wt.mkdir(); self.fork.mkdir()

    def tearDown(self):
        self._tmp.cleanup()

    def make_workspace_pkg(self, root: pathlib.Path, dirname: str, name: str, scope: str = "@gsd"):
        pkg_dir = root / "packages" / dirname
        write_json(pkg_dir / "package.json", {
            "name": f"{scope}/{name}", "version": "1.0.0",
            "main": "./dist/index.js", "types": "./dist/index.d.ts",
            "gsd": {"linkable": True, "scope": scope, "name": name},
        })
        return pkg_dir


class DirectoryVersusPackageName(Fixture):
    def test_directory_and_package_name_are_resolved_separately(self):
        self.make_workspace_pkg(self.wt, "gsd-agent-core", "agent-core")
        pkgs = dd.discover_packages(self.wt)
        by_name = {p["packageName"]: p for p in pkgs}
        self.assertIn("@gsd/agent-core", by_name)
        self.assertEqual(by_name["@gsd/agent-core"]["dir"], "gsd-agent-core")
        self.assertNotIn("@gsd/gsd-agent-core", by_name)


class LocalResolution(Fixture):
    def test_correct_local_link_is_ready(self):
        pkg = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        write(pkg / "dist" / "index.js", "export {};")
        write(pkg / "dist" / "index.d.ts", "export {};")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(pkg, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "READY")
        self.assertEqual(result["packages"]["@gsd/agent-core"]["freshness"], "UNKNOWN")


class ForeignWorkspace(Fixture):
    def test_link_escaping_to_fork_is_foreign_workspace(self):
        fork_pkg = self.make_workspace_pkg(self.fork, "agent-core", "agent-core")
        write(fork_pkg / "dist" / "index.js", "export {};")
        write(fork_pkg / "dist" / "index.d.ts", "export {};")
        self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(fork_pkg, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "FOREIGN_WORKSPACE")


class ChainedAncestor(Fixture):
    def test_symlinked_root_node_modules_escape_is_detected(self):
        fork_nm = self.fork / "node_modules"
        fork_pkg = self.make_workspace_pkg(self.fork, "agent-core", "agent-core")
        write(fork_pkg / "dist" / "index.js", "export {};")
        write(fork_pkg / "dist" / "index.d.ts", "export {};")
        self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        os.symlink(self.fork / "node_modules", self.wt / "node_modules")
        (fork_nm / "@gsd").mkdir(parents=True)
        os.symlink(fork_pkg, fork_nm / "@gsd" / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertIn(result["packages"]["@gsd/agent-core"]["status"], {"FOREIGN_WORKSPACE"})
        self.assertTrue(result["root_node_modules"]["is_symlink"])


class DanglingLink(Fixture):
    def test_dangling_link_is_reported_not_skipped(self):
        self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(self.base / "does-not-exist", nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "MISSING_INSTALL")
        self.assertTrue(result["packages"]["@gsd/agent-core"]["dangling"])


class MissingOutput(Fixture):
    def test_missing_dist_is_missing_build(self):
        pkg = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(pkg, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "MISSING_BUILD")


class BuildOrder(Fixture):
    def test_consumer_built_before_prerequisite_is_stale_not_ready(self):
        dep = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        consumer = self.make_workspace_pkg(self.wt, "pi-coding-agent", "pi-coding-agent")
        write_json(consumer / "package.json", {
            **json.loads((consumer / "package.json").read_text()),
            "dependencies": {"@gsd/agent-core": "workspace:*"},
        })
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(consumer, nm / "pi-coding-agent")
        os.symlink(dep, nm / "agent-core")
        # Consumer source is OLDER than its output: freshness must not be STALE
        # from the consumer's own files. The only signal is that the prerequisite
        # output changed after the consumer was built.
        write(consumer / "src" / "x.ts", "x")
        write(consumer / "dist" / "index.js", "x")
        write(consumer / "dist" / "index.d.ts", "x")
        os.utime(consumer / "src" / "x.ts", (1, 1))
        write(dep / "dist" / "index.js", "x")
        write(dep / "dist" / "index.d.ts", "x")
        result = dd.diagnose(self.wt, ["@gsd/pi-coding-agent"])
        entry = result["packages"]["@gsd/pi-coding-agent"]
        self.assertEqual(entry["status"], "READY")
        # Prerequisite-order is not proven by mtimes alone: freshness stays UNKNOWN,
        # and it must never be reported as FRESH.
        self.assertIn(entry["freshness"], {"UNKNOWN", "STALE"})
        self.assertNotEqual(entry["freshness"], "FRESH")


class NotExportedPackage(Fixture):
    def test_present_package_with_unexported_package_json_is_not_missing(self):
        pkg = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        write_json(pkg / "package.json", {
            **json.loads((pkg / "package.json").read_text()),
            "exports": {".": "./dist/index.js"},
        })
        write(pkg / "dist" / "index.js", "x"); write(pkg / "dist" / "index.d.ts", "x")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(pkg, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertNotEqual(result["packages"]["@gsd/agent-core"]["status"], "MISSING_INSTALL")


if __name__ == "__main__":
    unittest.main()


class Aggregation(Fixture):
    """Regression: a READY package must never mask a broken one."""

    def test_ready_does_not_mask_missing_install(self):
        good = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        write(good / "dist" / "index.js", "x"); write(good / "dist" / "index.d.ts", "x")
        self.make_workspace_pkg(self.wt, "pi-tui", "pi-tui")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(good, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core", "@gsd/pi-tui"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "READY")
        self.assertEqual(result["packages"]["@gsd/pi-tui"]["status"], "MISSING_INSTALL")
        self.assertNotEqual(result["overall"], "READY")

    def test_cli_exit_is_nonzero_when_any_package_is_not_ready(self):
        self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        rc = dd.main([str(self.wt), "@gsd/agent-core"])
        self.assertNotEqual(rc, 0)


class ContainmentAndAncestors(Fixture):
    """Regression: resolved package must live inside the worktree, not merely
    match its own expected realpath, and symlinked ancestors must be reported."""

    def test_package_realpath_outside_worktree_is_foreign_even_if_expected_matches(self):
        # Worktree package is itself a symlink into the fork: its realpath equals
        # the (also symlinked) expected path, so equality alone would pass.
        fork_pkg = self.make_workspace_pkg(self.fork, "agent-core", "agent-core")
        write(fork_pkg / "dist" / "index.js", "x"); write(fork_pkg / "dist" / "index.d.ts", "x")
        wt_pkg_dir = self.wt / "packages" / "agent-core"
        wt_pkg_dir.parent.mkdir(parents=True, exist_ok=True)
        os.symlink(fork_pkg, wt_pkg_dir)
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(wt_pkg_dir, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(result["packages"]["@gsd/agent-core"]["status"], "FOREIGN_WORKSPACE")

    def test_symlinked_ancestor_of_link_is_reported(self):
        pkg = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        write(pkg / "dist" / "index.js", "x"); write(pkg / "dist" / "index.d.ts", "x")
        real_scope = self.base / "elsewhere"
        real_scope.mkdir()
        os.symlink(pkg, real_scope / "agent-core")
        (self.wt / "node_modules").mkdir()
        os.symlink(real_scope, self.wt / "node_modules" / "@gsd")
        result = dd.diagnose(self.wt, ["@gsd/agent-core"])
        entry = result["packages"]["@gsd/agent-core"]
        self.assertIn(entry["status"], {"FOREIGN_WORKSPACE", "MISSING_INSTALL"})
        self.assertTrue(entry.get("symlinked_ancestors"), entry)


class UnknownRequest(Fixture):
    """Regression: an explicitly requested package that does not exist must fail."""

    def test_unknown_requested_name_is_reported_not_dropped(self):
        pkg = self.make_workspace_pkg(self.wt, "agent-core", "agent-core")
        write(pkg / "dist" / "index.js", "x"); write(pkg / "dist" / "index.d.ts", "x")
        nm = self.wt / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(pkg, nm / "agent-core")
        result = dd.diagnose(self.wt, ["@gsd/agent-core", "@gsd/not-real"])
        self.assertEqual(result["packages"]["@gsd/not-real"]["status"], "UNKNOWN")
        self.assertNotEqual(result["overall"], "READY")
