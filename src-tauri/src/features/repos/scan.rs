use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Directory names we never descend into while looking for repos.
const SKIP_DIRS: &[&str] = &["node_modules", "target", ".git", "dist", "vendor", ".cache"];
const MAX_DEPTH: usize = 6;

/// Walk `root` and return every git repository found, without descending into a
/// repo's working tree or into noise directories.
pub fn discover(root: &Path) -> Vec<PathBuf> {
    let mut repos = Vec::new();
    let mut walker = WalkDir::new(root).max_depth(MAX_DEPTH).into_iter();

    while let Some(entry) = walker.next() {
        let entry = match entry {
            Ok(e) if e.file_type().is_dir() => e,
            _ => continue,
        };

        let name = entry.file_name().to_str().unwrap_or("");
        if entry.depth() > 0 && SKIP_DIRS.contains(&name) {
            walker.skip_current_dir();
            continue;
        }

        // `.git` is a dir in a normal clone and a file in worktrees/submodules.
        if entry.path().join(".git").exists() {
            repos.push(entry.path().to_path_buf());
            walker.skip_current_dir();
        }
    }

    repos
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn finds_repos_prunes_noise_and_does_not_nest() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        fs::create_dir_all(root.join("a/.git")).unwrap();
        fs::create_dir_all(root.join("a/src")).unwrap();
        fs::create_dir_all(root.join("group/b/.git")).unwrap();
        // Pruned: fake repo inside node_modules.
        fs::create_dir_all(root.join("node_modules/pkg/.git")).unwrap();
        // Not descended into: a repo nested inside repo `a`.
        fs::create_dir_all(root.join("a/nested/.git")).unwrap();

        let mut found: Vec<String> = discover(root)
            .into_iter()
            .map(|p| {
                p.strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/")
            })
            .collect();
        found.sort();

        assert_eq!(found, vec!["a".to_string(), "group/b".to_string()]);
    }
}
