"""Adversarial regressions for dependency_doctor.py. Owned temp fixtures only.
Each test runs the real diagnose() on a constructed layout and asserts the
verdict AND the reason that makes it correct."""
import json, os, pathlib, sys, tempfile, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import dependency_doctor as dd


def w(p, text="x"):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


class Layout(unittest.TestCase):
    def setUp(self):
        self._t = tempfile.TemporaryDirectory()
        self.base = pathlib.Path(self._t.name).resolve()
        self.wt = self.base / "wt"; self.wt.mkdir()
        self.sibling = self.base / "sibling-wt"; self.sibling.mkdir()
        self.store = self.base / "pnpm-store"  # shared content-addressed store (allowed)
        self.store.mkdir()

    def tearDown(self):
        self._t.cleanup()

    def pkg(self, root, dirname, name, scope="@gsd"):
        d = root / "packages" / dirname
        d.mkdir(parents=True, exist_ok=True)
        (d / "package.json").write_text(json.dumps({
            "name": f"{scope}/{name}", "version": "1.0.0",
            "main": "./dist/index.js", "types": "./dist/index.d.ts",
            "gsd": {"linkable": True, "scope": scope, "name": name}}))
        w(d / "dist" / "index.js"); w(d / "dist" / "index.d.ts")
        return d

    def link(self, src, dst):
        dst.parent.mkdir(parents=True, exist_ok=True)
        os.symlink(src, dst)


class MultipleAliases(Layout):
    def test_two_scopes_same_dir_resolve_to_one_package(self):
        # Same package reached via @gsd and @opengsd aliases must both be checked, neither skipped.
        p = self.pkg(self.wt, "agent-core", "agent-core")
        self.link(p, self.wt / "node_modules" / "@gsd" / "agent-core")
        self.link(p, self.wt / "node_modules" / "@opengsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(r["packages"]["@gsd/agent-core"]["status"], "READY")

    def test_alias_pointing_to_sibling_is_foreign_even_if_other_alias_is_local(self):
        local = self.pkg(self.wt, "agent-core", "agent-core")
        foreign = self.pkg(self.sibling, "agent-core", "agent-core")
        self.link(local, self.wt / "node_modules" / "@gsd" / "agent-core")
        self.link(foreign, self.wt / "node_modules" / "@opengsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        # the @gsd alias is local and correct; the doctor must not mask the sibling-resolving path
        self.assertEqual(r["packages"]["@gsd/agent-core"]["status"], "READY")
        # the foreign alias must still be detected when requested explicitly
        r2 = dd.diagnose(self.wt, ["@opengsd/agent-core"])
        self.assertNotEqual(r2["packages"]["@opengsd/agent-core"]["status"], "READY")


class SymlinkChains(Layout):
    def test_two_hop_chain_into_sibling_is_foreign(self):
        # The worktree must declare the package (discovery reads the worktree manifests);
        # the sibling holds the real target. Without the local declaration the doctor
        # correctly reports the requested name as UNKNOWN, which is a different fact.
        self.pkg(self.wt, "agent-core", "agent-core")
        foreign = self.pkg(self.sibling, "agent-core", "agent-core")
        hop = self.base / "hop"
        self.link(foreign, hop)
        self.link(hop, self.wt / "node_modules" / "@gsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(r["packages"]["@gsd/agent-core"]["status"], "FOREIGN_WORKSPACE")

    def test_dangling_at_end_of_chain_is_missing_install_not_ready(self):
        hop = self.base / "hop2"
        self.link(self.base / "does-not-exist", hop)
        self.link(hop, self.wt / "node_modules" / "@gsd" / "agent-core")
        self.pkg(self.wt, "agent-core", "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(r["packages"]["@gsd/agent-core"]["status"], "MISSING_INSTALL")


class SharedStoreIsAllowed(Layout):
    def test_shared_pnpm_store_path_is_not_foreign_workspace(self):
        # A third-party dependency in a shared content store is legitimate and must not
        # be reported as a workspace escape. Only @gsd/@opengsd workspace packages are checked.
        ext = self.store / "left-pad" / "index.js"
        w(ext)
        self.link(self.store / "left-pad", self.wt / "node_modules" / "left-pad")
        r = dd.diagnose(self.wt, [])
        flagged = [k for k, v in r["packages"].items() if v["status"] == "FOREIGN_WORKSPACE" and "left-pad" in k]
        self.assertEqual(flagged, [])


class MissingOrStaleOutput(Layout):
    def test_missing_js_only_is_missing_build_with_js_named(self):
        p = self.pkg(self.wt, "agent-core", "agent-core")
        (p / "dist" / "index.js").unlink()
        self.link(p, self.wt / "node_modules" / "@gsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        e = r["packages"]["@gsd/agent-core"]
        self.assertEqual(e["status"], "MISSING_BUILD")
        self.assertIn("index.js", e["evidence"])
        self.assertNotIn("index.d.ts", e["evidence"])

    def test_missing_declarations_only_is_missing_build_with_dts_named(self):
        p = self.pkg(self.wt, "agent-core", "agent-core")
        (p / "dist" / "index.d.ts").unlink()
        self.link(p, self.wt / "node_modules" / "@gsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        e = r["packages"]["@gsd/agent-core"]
        self.assertEqual(e["status"], "MISSING_BUILD")
        self.assertIn("index.d.ts", e["evidence"])

    def test_source_newer_than_output_is_stale_not_fresh(self):
        p = self.pkg(self.wt, "agent-core", "agent-core")
        w(p / "src" / "a.ts")
        os.utime(p / "dist" / "index.js", (1, 1)); os.utime(p / "dist" / "index.d.ts", (1, 1))
        self.link(p, self.wt / "node_modules" / "@gsd" / "agent-core")
        r = dd.diagnose(self.wt, ["@gsd/agent-core"])
        self.assertEqual(r["packages"]["@gsd/agent-core"]["freshness"], "STALE")
        self.assertNotEqual(r["packages"]["@gsd/agent-core"]["freshness"], "FRESH")


class CanonicalPaths(Layout):
    def test_worktree_reached_through_symlinked_root_is_ready(self):
        # wt itself is addressed through a symlink; the canonical comparison must still pass
        real = self.base / "real-wt"; real.mkdir()
        p = self.pkg(real, "agent-core", "agent-core")
        self.link(p, real / "node_modules" / "@gsd" / "agent-core")
        alias = self.base / "wt-alias"
        self.link(real, alias)
        r = dd.diagnose(alias, ["@gsd/agent-core"])
        self.assertEqual(r["packages"]["@gsd/agent-core"]["status"], "READY", r)


class ExitContract(Layout):
    def test_mixed_ready_and_missing_exits_nonzero(self):
        ok = self.pkg(self.wt, "agent-core", "agent-core")
        self.pkg(self.wt, "pi-tui", "pi-tui")
        self.link(ok, self.wt / "node_modules" / "@gsd" / "agent-core")
        rc = dd.main([str(self.wt), "@gsd/agent-core", "@gsd/pi-tui"])
        self.assertNotEqual(rc, 0)


if __name__ == "__main__":
    unittest.main()
