use crate::features::scripts::model::{Script, ScriptKind, ScriptScope};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Directory names we never descend into while collecting scripts.
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    ".git",
    "dist",
    "build",
    "vendor",
    ".cache",
    "out",
    "coverage",
];

/// Conventional folders inside a repo that hold runnable scripts.
const SCRIPT_DIRS: &[&str] = &["scripts", ".dever"];

/// Map a file name's extension to the interpreter family, or `None` when it
/// isn't a script we know how to run.
pub fn kind_for(name: &str) -> Option<ScriptKind> {
    let ext = name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase())?;
    Some(match ext.as_str() {
        "ps1" => ScriptKind::PowerShell,
        "sh" => ScriptKind::Shell,
        "bat" | "cmd" => ScriptKind::Batch,
        "py" => ScriptKind::Python,
        "js" | "mjs" => ScriptKind::Node,
        _ => return None,
    })
}

/// Discover runnable scripts under `root`. For a repo, only the conventional
/// `scripts/` and `.dever/` folders are scanned; for the global folder, `root`
/// itself is scanned. `rel_path` is relative to `root` with forward slashes.
/// Results are sorted by relative path (case-insensitive).
pub fn discover(root: &Path, scope: ScriptScope) -> Vec<Script> {
    let bases: Vec<PathBuf> = match scope {
        ScriptScope::Repo => SCRIPT_DIRS
            .iter()
            .map(|d| root.join(d))
            .filter(|p| p.is_dir())
            .collect(),
        ScriptScope::Global => vec![root.to_path_buf()],
    };

    let mut out: Vec<Script> = Vec::new();
    for base in bases {
        let mut walker = WalkDir::new(&base).into_iter();
        while let Some(entry) = walker.next() {
            let entry = match entry {
                Ok(e) => e,
                _ => continue,
            };
            let name = entry.file_name().to_str().unwrap_or("");
            if entry.file_type().is_dir() {
                if entry.depth() > 0 && (SKIP_DIRS.contains(&name) || name.starts_with('.')) {
                    walker.skip_current_dir();
                }
                continue;
            }
            let kind = match kind_for(name) {
                Some(k) => k,
                None => continue,
            };
            let rel = match entry.path().strip_prefix(root) {
                Ok(r) => r.to_string_lossy().replace('\\', "/"),
                _ => continue,
            };
            out.push(Script {
                path: entry.path().to_string_lossy().to_string(),
                name: name.to_string(),
                rel_path: rel,
                kind,
                scope,
            });
        }
    }
    out.sort_by_key(|s| s.rel_path.to_lowercase());
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn kind_for_matches_known_extensions_only() {
        assert_eq!(kind_for("build.ps1"), Some(ScriptKind::PowerShell));
        assert_eq!(kind_for("seed.SH"), Some(ScriptKind::Shell));
        assert_eq!(kind_for("task.bat"), Some(ScriptKind::Batch));
        assert_eq!(kind_for("task.cmd"), Some(ScriptKind::Batch));
        assert_eq!(kind_for("gen.py"), Some(ScriptKind::Python));
        assert_eq!(kind_for("tool.mjs"), Some(ScriptKind::Node));
        assert_eq!(kind_for("README.md"), None);
        assert_eq!(kind_for("Makefile"), None);
    }

    #[test]
    fn discover_repo_only_scans_conventional_folders() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();
        fs::create_dir_all(root.join("scripts/sub")).unwrap();
        fs::write(root.join("scripts/build.ps1"), "").unwrap();
        fs::write(root.join("scripts/sub/deep.sh"), "").unwrap();
        fs::write(root.join("scripts/README.md"), "").unwrap(); // not a script
        fs::create_dir_all(root.join(".dever")).unwrap();
        fs::write(root.join(".dever/task.py"), "").unwrap();
        // Scripts outside the conventional folders must be ignored.
        fs::create_dir_all(root.join("src")).unwrap();
        fs::write(root.join("src/loose.ps1"), "").unwrap();
        fs::write(root.join("top.ps1"), "").unwrap();

        let rels: Vec<String> = discover(root, ScriptScope::Repo)
            .into_iter()
            .map(|s| s.rel_path)
            .collect();

        assert_eq!(
            rels,
            vec![
                ".dever/task.py".to_string(),
                "scripts/build.ps1".to_string(),
                "scripts/sub/deep.sh".to_string(),
            ]
        );
    }

    #[test]
    fn discover_global_scans_the_root_itself() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();
        fs::write(root.join("deploy.ps1"), "").unwrap();
        fs::create_dir_all(root.join("helpers")).unwrap();
        fs::write(root.join("helpers/util.py"), "").unwrap();
        fs::write(root.join("notes.txt"), "").unwrap(); // not a script

        let scripts = discover(root, ScriptScope::Global);
        let rels: Vec<&str> = scripts.iter().map(|s| s.rel_path.as_str()).collect();
        assert_eq!(rels, vec!["deploy.ps1", "helpers/util.py"]);
        assert!(scripts.iter().all(|s| s.scope == ScriptScope::Global));
    }
}
