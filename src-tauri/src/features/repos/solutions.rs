use crate::features::repos::model::{Solution, SolutionKind};
use std::path::Path;
use walkdir::WalkDir;

/// Directory names we never descend into while looking for solutions. Build
/// output (`bin`, `obj`) is the important one: it holds copies of project files
/// that would otherwise show up as duplicates of the real ones.
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    ".git",
    ".vs",
    "bin",
    "obj",
    "dist",
    "vendor",
    ".cache",
    "packages",
];

/// Map a file name's extension to the kind of Visual Studio target it is, or
/// `None` when it isn't one.
pub fn kind_for(name: &str) -> Option<SolutionKind> {
    let ext = name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase())?;
    Some(match ext.as_str() {
        "sln" => SolutionKind::Solution,
        "csproj" => SolutionKind::Project,
        _ => return None,
    })
}

/// Find every `.sln` and `.csproj` under `repo`, at any depth, skipping build
/// output and other noise directories. Solutions come first — they're what a
/// developer normally wants — then projects, each group ordered by relative
/// path (case-insensitive).
pub fn discover(repo: &Path) -> Vec<Solution> {
    let mut out: Vec<Solution> = Vec::new();
    let mut walker = WalkDir::new(repo).into_iter();

    while let Some(entry) = walker.next() {
        let entry = match entry {
            Ok(e) => e,
            _ => continue,
        };
        let name = entry.file_name().to_str().unwrap_or("");

        if entry.file_type().is_dir() {
            if entry.depth() > 0 && SKIP_DIRS.contains(&name) {
                walker.skip_current_dir();
            }
            continue;
        }

        let kind = match kind_for(name) {
            Some(k) => k,
            None => continue,
        };
        let rel = match entry.path().strip_prefix(repo) {
            Ok(r) => r.to_string_lossy().replace('\\', "/"),
            _ => continue,
        };
        out.push(Solution {
            path: entry.path().to_string_lossy().to_string(),
            name: name.to_string(),
            rel_path: rel,
            kind,
        });
    }

    out.sort_by_key(|s| (s.kind != SolutionKind::Solution, s.rel_path.to_lowercase()));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    /// Lay out a repo with a solution, two projects, and copies of a project
    /// file in the places we're supposed to ignore.
    fn fixture(root: &Path) {
        fs::create_dir_all(root.join("src/App")).unwrap();
        fs::create_dir_all(root.join("tests/App.Tests")).unwrap();
        fs::create_dir_all(root.join("src/App/obj/Debug")).unwrap();
        fs::create_dir_all(root.join("node_modules/pkg")).unwrap();

        fs::write(root.join("App.sln"), "").unwrap();
        fs::write(root.join("src/App/App.csproj"), "").unwrap();
        fs::write(root.join("tests/App.Tests/App.Tests.csproj"), "").unwrap();
        fs::write(root.join("src/App/obj/Debug/App.csproj"), "").unwrap();
        fs::write(root.join("node_modules/pkg/Vendored.csproj"), "").unwrap();
        fs::write(root.join("README.md"), "").unwrap();
    }

    #[test]
    fn kind_follows_the_extension() {
        assert_eq!(kind_for("App.sln"), Some(SolutionKind::Solution));
        assert_eq!(kind_for("App.SLN"), Some(SolutionKind::Solution));
        assert_eq!(kind_for("App.csproj"), Some(SolutionKind::Project));
        assert_eq!(kind_for("App.fsproj"), None);
        assert_eq!(kind_for("README.md"), None);
        assert_eq!(kind_for("Makefile"), None);
    }

    #[test]
    fn finds_solutions_and_projects_solutions_first() {
        let dir = tempdir().unwrap();
        fixture(dir.path());

        let found = discover(dir.path());
        let rels: Vec<&str> = found.iter().map(|s| s.rel_path.as_str()).collect();

        assert_eq!(
            rels,
            vec![
                "App.sln",
                "src/App/App.csproj",
                "tests/App.Tests/App.Tests.csproj"
            ]
        );
    }

    #[test]
    fn skips_build_output_and_vendored_copies() {
        let dir = tempdir().unwrap();
        fixture(dir.path());

        let found = discover(dir.path());

        assert!(!found.iter().any(|s| s.rel_path.contains("/obj/")));
        assert!(!found.iter().any(|s| s.rel_path.contains("node_modules")));
    }

    #[test]
    fn reports_name_and_absolute_path() {
        let dir = tempdir().unwrap();
        fixture(dir.path());

        let found = discover(dir.path());
        let sln = &found[0];

        assert_eq!(sln.name, "App.sln");
        assert_eq!(sln.kind, SolutionKind::Solution);
        assert_eq!(sln.path, dir.path().join("App.sln").to_string_lossy());
    }

    #[test]
    fn empty_when_the_repo_has_none() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("main.rs"), "").unwrap();

        assert!(discover(dir.path()).is_empty());
    }
}
