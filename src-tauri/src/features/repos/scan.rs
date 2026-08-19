use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Directory names we never descend into while looking for repos.
const SKIP_DIRS: &[&str] = &["node_modules", "target", ".git", "dist", "vendor", ".cache"];

/// Walk `root` and return every git repository found, at any depth, without
/// descending into a repo's working tree or into noise directories. There is no
/// depth cap — pruning noise dirs and stopping at each repo boundary keeps the
/// walk bounded in practice.
///
/// Linked worktrees are skipped unless `include_worktrees` is set; either way
/// the walk still stops at their boundary, so nothing inside them is descended.
pub fn discover(root: &Path, include_worktrees: bool) -> Vec<PathBuf> {
    let mut repos = Vec::new();
    let mut walker = WalkDir::new(root).into_iter();

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
            if include_worktrees || !is_worktree(entry.path()) {
                repos.push(entry.path().to_path_buf());
            }
            walker.skip_current_dir();
        }
    }

    repos
}

/// True when `repo` is a linked git worktree rather than a normal clone. A
/// worktree's `.git` is a *file* pointing at `<gitdir>/worktrees/<name>`, while
/// a submodule's points at `<gitdir>/modules/<name>` — so the marker is a
/// `worktrees` component directly under the repo's git dir.
fn is_worktree(repo: &Path) -> bool {
    let dot_git = repo.join(".git");
    if dot_git.is_dir() {
        return false;
    }
    std::fs::read_to_string(&dot_git).is_ok_and(|c| gitdir_points_into_worktrees(&c))
}

/// Pure parser for a `.git` file's `gitdir:` pointer.
fn gitdir_points_into_worktrees(contents: &str) -> bool {
    contents
        .lines()
        .filter_map(|line| line.trim().strip_prefix("gitdir:"))
        .any(|gitdir| {
            let segments: Vec<&str> = gitdir
                .trim()
                .split(['/', '\\'])
                .filter(|s| !s.is_empty())
                .collect();
            segments
                .windows(2)
                .any(|w| w[0].ends_with(".git") && w[1] == "worktrees")
        })
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

        let mut found: Vec<String> = discover(root, true)
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

    #[test]
    fn finds_repos_nested_beyond_the_old_depth_cap() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();

        // Eight levels deep — past the former MAX_DEPTH of 6.
        let deep = root.join("a/b/c/d/e/f/g/repo");
        fs::create_dir_all(deep.join(".git")).unwrap();

        let found: Vec<String> = discover(root, true)
            .into_iter()
            .map(|p| {
                p.strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/")
            })
            .collect();

        assert_eq!(found, vec!["a/b/c/d/e/f/g/repo".to_string()]);
    }

    /// Lay out a clone, one of its linked worktrees, and a submodule.
    fn worktree_fixture(root: &Path) {
        fs::create_dir_all(root.join("app/.git/worktrees/feat")).unwrap();
        fs::create_dir_all(root.join("feat")).unwrap();
        fs::write(
            root.join("feat/.git"),
            format!("gitdir: {}/app/.git/worktrees/feat\n", root.display()),
        )
        .unwrap();
        fs::create_dir_all(root.join("lib")).unwrap();
        fs::write(root.join("lib/.git"), "gitdir: ../app/.git/modules/lib\n").unwrap();
    }

    fn discovered(root: &Path, include_worktrees: bool) -> Vec<String> {
        let mut found: Vec<String> = discover(root, include_worktrees)
            .into_iter()
            .map(|p| {
                p.strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/")
            })
            .collect();
        found.sort();
        found
    }

    #[test]
    fn includes_worktrees_when_asked() {
        let tmp = tempfile::tempdir().unwrap();
        worktree_fixture(tmp.path());
        assert_eq!(discovered(tmp.path(), true), vec!["app", "feat", "lib"]);
    }

    #[test]
    fn skips_worktrees_but_keeps_submodules_when_excluded() {
        let tmp = tempfile::tempdir().unwrap();
        worktree_fixture(tmp.path());
        assert_eq!(discovered(tmp.path(), false), vec!["app", "lib"]);
    }

    #[test]
    fn gitdir_pointer_distinguishes_worktrees_from_submodules() {
        assert!(gitdir_points_into_worktrees(
            "gitdir: /code/app/.git/worktrees/feat"
        ));
        assert!(gitdir_points_into_worktrees(
            "gitdir: C:\\code\\app\\.git\\worktrees\\feat"
        ));
        assert!(!gitdir_points_into_worktrees(
            "gitdir: ../app/.git/modules/lib"
        ));
        // A repo that merely lives under a folder named `worktrees` is a clone.
        assert!(!gitdir_points_into_worktrees(
            "gitdir: /code/worktrees/app/.git"
        ));
        assert!(!gitdir_points_into_worktrees(""));
    }
}
