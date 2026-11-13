#!/usr/bin/env python3
"""Read-only dependency doctor for gsd-pi worktrees.

Usage: dependency_doctor.py WORKTREE_ROOT [@scope/pkg ...] [--json]

Never installs, builds, deletes, or imports runtime modules. It inspects the
on-disk links and package outputs and reports a status per package:

  READY, MISSING_INSTALL, FOREIGN_WORKSPACE, MISSING_BUILD, UNKNOWN

READY means only that the checked dependency conditions hold. Staleness is not a
dependency status: it is reported in the separate `freshness` field, as STALE when a
source file is newer than the built output, otherwise UNKNOWN. It is never FRESH,
because mtimes are evidence, not proof.
"""
import json, os, pathlib, sys

# Strictest first. Overall is the first non-READY status found in this order,
# so a READY package can never mask a broken one.
STATUS_ORDER = ["MISSING_INSTALL", "FOREIGN_WORKSPACE", "MISSING_BUILD", "STALE_BUILD", "UNKNOWN", "READY"]


def discover_packages(root: pathlib.Path):
    """Canonical packages: name from package.json, dir kept separate."""
    out = []
    packages_dir = root / "packages"
    if not packages_dir.is_dir():
        return out
    for d in sorted(packages_dir.iterdir()):
        pj = d / "package.json"
        if not pj.is_file():
            continue
        data = json.loads(pj.read_text())
        gsd = data.get("gsd") or {}
        if gsd.get("linkable") is not True:
            continue
        out.append({
            "dir": d.name,
            "packageName": data["name"],
            "path": d,
            "packageJson": data,
        })
    return out


def _ancestors_symlinked(path: pathlib.Path, stop: pathlib.Path):
    """Return every ancestor of path strictly below stop that is itself a symlink.

    Walks up from path.parent to stop (exclusive). A symlinked ancestor such as
    node_modules/@gsd -> elsewhere is reported even when the leaf resolves to the
    expected location, because the directory the package is reached through is
    outside the worktree.
    """
    found = []
    stop = stop.resolve() if stop.exists() else stop
    cur = path.parent
    for _ in range(256):  # bounded walk; no unbounded loops on pathological paths
        if cur == stop or cur == cur.parent:
            break
        if cur.is_symlink():
            found.append(str(cur))
        cur = cur.parent
    return found


def _resolve_link(link: pathlib.Path):
    """Resolve one link without following into missing targets silently."""
    try:
        target = os.path.realpath(link)
    except OSError as err:
        return None, f"realpath error: {err}"
    dangling = link.is_symlink() and not os.path.exists(target)
    return target, ("dangling" if dangling else None)


def _mtime_newest(paths):
    newest = None
    for p in paths:
        if p.exists():
            m = p.stat().st_mtime
            newest = m if newest is None else max(newest, m)
    return newest


def diagnose_package(root: pathlib.Path, pkg, nm_root: pathlib.Path):
    name = pkg["packageName"]
    scope, short = name.split("/", 1)
    link = nm_root / scope / short
    info = {"packageName": name, "dir": pkg["dir"], "expected": str(pkg["path"])}
    info["link_is_symlink"] = link.is_symlink()
    info["symlinked_ancestors"] = _ancestors_symlinked(link, nm_root.parent)
    info["link_exists"] = link.exists() or link.is_symlink()

    if not info["link_exists"]:
        info.update(status="MISSING_INSTALL", evidence=f"no entry at {link}",
                    fix="pnpm install --frozen-lockfile")
        return info

    if info["symlinked_ancestors"]:
        info.update(status="FOREIGN_WORKSPACE",
                    evidence=f"symlinked ancestor(s) {info['symlinked_ancestors']} in path to {link}",
                    fix="replace the symlinked directory with a real one inside this worktree and reinstall")
        return info

    target, flag = _resolve_link(link)
    info["resolved"] = target
    info["dangling"] = flag == "dangling"
    if info["dangling"] or target is None:
        info.update(status="MISSING_INSTALL", evidence=f"dangling link {link} -> {target}",
                    fix="pnpm install --frozen-lockfile")
        return info

    expected = os.path.realpath(pkg["path"])
    worktree_real = os.path.realpath(root)
    inside = target == worktree_real or target.startswith(worktree_real + os.sep)
    if target != expected or not inside:
        info.update(status="FOREIGN_WORKSPACE",
                    evidence=f"{link} resolves to {target}, expected {expected}",
                    fix="remove the foreign link and reinstall inside this worktree")
        return info

    dist_js = pkg["path"] / "dist" / "index.js"
    dist_dts = pkg["path"] / "dist" / "index.d.ts"
    if not (dist_js.is_file() and dist_dts.is_file()):
        missing = [str(p.name) for p in (dist_js, dist_dts) if not p.is_file()]
        info.update(status="MISSING_BUILD", evidence=f"missing output: {', '.join(missing)}",
                    fix=f"pnpm --filter {name} run build (after its prerequisites)")
        return info

    info["status"] = "READY"
    info["freshness"] = freshness(pkg, dist_js, dist_dts)
    info["evidence"] = "links resolve in-worktree; output present"
    info["fix"] = None if info["freshness"] != "STALE" else f"pnpm --filter {name} run build"
    return info


def freshness(pkg, dist_js, dist_dts):
    """Mtime is evidence, not proof: a newer source only proves STALE; otherwise UNKNOWN."""
    src_dir = pkg["path"] / "src"
    if not src_dir.is_dir():
        return "UNKNOWN"
    src_newest = _mtime_newest(p for p in src_dir.rglob("*.ts") if p.is_file())
    out_oldest = min(dist_js.stat().st_mtime, dist_dts.stat().st_mtime)
    if src_newest is not None and src_newest > out_oldest:
        return "STALE"
    return "UNKNOWN"


def diagnose(root, wanted=None):
    root = pathlib.Path(root).resolve()
    nm_root = root / "node_modules"
    result = {
        "worktree": str(root),
        "root_node_modules": {
            "exists": nm_root.exists() or nm_root.is_symlink(),
            "is_symlink": nm_root.is_symlink(),
            "target": os.path.realpath(nm_root) if nm_root.exists() else None,
        },
        "packages": {},
    }
    pkgs = discover_packages(root)
    for pkg in pkgs:
        if wanted and pkg["packageName"] not in wanted:
            continue
        result["packages"][pkg["packageName"]] = diagnose_package(root, pkg, nm_root)
    for name in (wanted or []):
        if name not in result["packages"]:
            result["packages"][name] = {
                "packageName": name, "status": "UNKNOWN",
                "evidence": "requested package is not a linkable workspace package",
                "fix": "check the package name against packages/*/package.json",
            }
    statuses = [p["status"] for p in result["packages"].values()]
    result["overall"] = next((st for st in STATUS_ORDER if st in statuses), "READY") if statuses else "UNKNOWN"
    return result


def main(argv):
    as_json = "--json" in argv
    args = [a for a in argv if a != "--json"]
    if not args:
        print(json.dumps({"error": "usage: dependency_doctor.py WORKTREE [@scope/pkg ...] [--json]"}))
        return 2
    res = diagnose(args[0], args[1:] or None)
    print(json.dumps(res, indent=2 if as_json else None, default=str))
    return 0 if res["overall"] == "READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
