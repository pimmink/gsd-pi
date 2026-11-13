"""Regression: a legitimate pnpm workspace link must be OK, not FOREIGN_WORKSPACE.

The existing suite proves a foreign shared root link is flagged. It did not prove
the converse: a link node_modules/@gsd/<pkg> -> packages/<pkg> inside the same
worktree, with the build output present, must be reported OK. Without this the
doctor could over-flag every healthy workspace link.
"""
import json
import os
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import dependency_doctor as d  # noqa: E402


class LegitWorkspaceLink(unittest.TestCase):
    def _worktree(self):
        # Build an explicit symlinked alias above the worktree so the regression is
        # reproduced on every platform, not only where the temp dir is aliased (macOS).
        real = pathlib.Path(tempfile.mkdtemp(prefix="legit-real-"))
        alias = pathlib.Path(tempfile.mkdtemp(prefix="legit-alias-")) / "parent"
        os.symlink(real, alias)
        root = alias / "wt"
        root.mkdir()
        pkg = root / "packages" / "native"
        (pkg / "dist").mkdir(parents=True)
        (pkg / "package.json").write_text(json.dumps({"name": "@gsd/native", "gsd": {"linkable": True}}))
        (pkg / "dist" / "index.js").write_text("export {};\n")
        (pkg / "dist" / "index.d.ts").write_text("export {};\n")
        nm = root / "node_modules" / "@gsd"
        nm.mkdir(parents=True)
        os.symlink(pkg, nm / "native")
        return root

    def test_in_worktree_workspace_link_with_build_is_not_flagged(self):
        root = self._worktree()
        pkg = d.discover_packages(root)[0]
        info = d.diagnose_package(root, pkg, root / "node_modules")
        self.assertNotEqual(info["status"], "FOREIGN_WORKSPACE", info.get("evidence"))
        self.assertEqual(info["status"], "READY", info.get("evidence"))

    def test_same_link_without_build_is_missing_build_not_foreign(self):
        root = self._worktree()
        (root / "packages" / "native" / "dist" / "index.d.ts").unlink()
        pkg = d.discover_packages(root)[0]
        info = d.diagnose_package(root, pkg, root / "node_modules")
        self.assertNotEqual(info["status"], "FOREIGN_WORKSPACE", info.get("evidence"))
        self.assertEqual(info["status"], "MISSING_BUILD", info.get("evidence"))


if __name__ == "__main__":
    unittest.main()
