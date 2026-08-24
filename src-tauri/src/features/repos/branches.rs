use crate::error::AppError;
use crate::features::repos::model::Branch;
use std::path::Path;
use std::process::Command;

/// List a repo's branches (local + remote) in one batched command. Shells out
/// to the user's `git` so their config applies, then parses the stable
/// `for-each-ref` output with a pure parser.
pub fn list(path: &Path) -> Result<Vec<Branch>, AppError> {
    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args([
            "for-each-ref",
            "--format=%(refname)%00%(HEAD)%00%(upstream:short)",
            "refs/heads",
            "refs/remotes",
        ])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(format!(
            "git for-each-ref failed in {}: {}",
            path.display(),
            stderr.trim()
        )));
    }

    Ok(parse_for_each_ref(&String::from_utf8_lossy(&output.stdout)))
}

/// Switch the repo to `name`. For a remote-only branch we strip the remote
/// prefix (e.g. `origin/feat` → `feat`) and let `git switch` DWIM-create a
/// local tracking branch; for a local branch we switch directly.
pub fn switch(path: &Path, name: &str, is_remote: bool) -> Result<(), AppError> {
    let target = if is_remote {
        name.split_once('/').map(|(_, rest)| rest).unwrap_or(name)
    } else {
        name
    };

    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(["switch", target])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(format!(
            "git switch {} failed in {}: {}",
            target,
            path.display(),
            stderr.trim()
        )));
    }

    Ok(())
}

/// Delete a local branch. `force` maps to `git branch -D` (drops the
/// merged-check), otherwise `-d` refuses to delete unmerged work.
pub fn delete_local(path: &Path, name: &str, force: bool) -> Result<(), AppError> {
    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(["branch", if force { "-D" } else { "-d" }, name])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(format!(
            "git branch delete {} failed in {}: {}",
            name,
            path.display(),
            stderr.trim()
        )));
    }

    Ok(())
}

/// Delete a branch on its remote. `name` is the remote-tracking short name
/// (e.g. `origin/feat`); the remote and branch are split from it.
pub fn delete_remote(path: &Path, name: &str) -> Result<(), AppError> {
    let (remote, branch) = name
        .split_once('/')
        .ok_or_else(|| AppError::new(format!("not a remote branch: {name}")))?;

    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(["push", remote, "--delete", branch])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(format!(
            "git push {} --delete {} failed in {}: {}",
            remote,
            branch,
            path.display(),
            stderr.trim()
        )));
    }

    Ok(())
}

/// Pure parser for `for-each-ref` output. Each record is one line of three
/// NUL-separated fields: the full refname, `*` for the current branch (else
/// empty), and the upstream short name (else empty). The namespace
/// (`refs/heads/` vs `refs/remotes/`) reliably tells local from remote; the
/// short name is derived from it, and the `origin/HEAD` symbolic pseudo-ref is
/// skipped.
pub fn parse_for_each_ref(output: &str) -> Vec<Branch> {
    let mut branches = Vec::new();
    for line in output.lines() {
        if line.is_empty() {
            continue;
        }
        let mut fields = line.split('\0');
        let refname = fields.next().unwrap_or("");
        let head = fields.next().unwrap_or("");
        let upstream = fields.next().unwrap_or("");

        let (is_remote, name) = if let Some(rest) = refname.strip_prefix("refs/remotes/") {
            (true, rest)
        } else if let Some(rest) = refname.strip_prefix("refs/heads/") {
            (false, rest)
        } else {
            continue;
        };
        if name.is_empty() || name.ends_with("/HEAD") {
            continue;
        }

        branches.push(Branch {
            name: name.to_string(),
            is_remote,
            is_current: head == "*",
            upstream: if upstream.is_empty() {
                None
            } else {
                Some(upstream.to_string())
            },
        });
    }
    branches
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn local_and_remote_with_current_marker() {
        let out = "refs/heads/main\0*\0origin/main\n\
                   refs/heads/feature\0\0\n\
                   refs/remotes/origin/main\0\0\n\
                   refs/remotes/origin/feature\0\0\n";
        let b = parse_for_each_ref(out);
        assert_eq!(b.len(), 4);

        assert_eq!(b[0].name, "main");
        assert!(b[0].is_current);
        assert!(!b[0].is_remote);
        assert_eq!(b[0].upstream.as_deref(), Some("origin/main"));

        assert_eq!(b[1].name, "feature");
        assert!(!b[1].is_current);
        assert!(!b[1].is_remote);
        assert_eq!(b[1].upstream, None);

        assert_eq!(b[2].name, "origin/main");
        assert!(b[2].is_remote);

        assert_eq!(b[3].name, "origin/feature");
        assert!(b[3].is_remote);
    }

    #[test]
    fn skips_origin_head_pseudo_ref() {
        let out = "refs/heads/main\0*\0\n\
                   refs/remotes/origin/HEAD\0\0\n\
                   refs/remotes/origin/main\0\0\n";
        let b = parse_for_each_ref(out);
        assert_eq!(b.len(), 2);
        assert!(b.iter().all(|x| x.name != "origin/HEAD"));
    }

    #[test]
    fn local_branch_with_slash_is_not_remote() {
        let out = "refs/heads/feature/login\0\0\n\
                   refs/remotes/origin/feature/login\0\0\n";
        let b = parse_for_each_ref(out);
        assert_eq!(b[0].name, "feature/login");
        assert!(!b[0].is_remote);
        assert_eq!(b[1].name, "origin/feature/login");
        assert!(b[1].is_remote);
    }

    #[test]
    fn empty_output_is_no_branches() {
        assert!(parse_for_each_ref("").is_empty());
    }

    /// A repo with one commit on `main` and an extra `feature` branch.
    fn repo_with_feature_branch() -> tempfile::TempDir {
        let dir = tempfile::tempdir().unwrap();
        let git = |args: &[&str]| {
            let out = Command::new("git")
                .arg("-C")
                .arg(dir.path())
                .args(args)
                .output()
                .unwrap();
            assert!(out.status.success(), "git {args:?}: {:?}", out);
        };
        git(&["init", "-b", "main"]);
        git(&["config", "user.email", "t@example.com"]);
        git(&["config", "user.name", "T"]);
        git(&["commit", "--allow-empty", "-m", "init"]);
        git(&["branch", "feature"]);
        dir
    }

    #[test]
    fn delete_local_removes_a_merged_branch() {
        let dir = repo_with_feature_branch();
        delete_local(dir.path(), "feature", false).unwrap();
        let names: Vec<_> = list(dir.path())
            .unwrap()
            .into_iter()
            .map(|b| b.name)
            .collect();
        assert_eq!(names, vec!["main"]);
    }

    #[test]
    fn delete_local_refuses_the_current_branch() {
        let dir = repo_with_feature_branch();
        let err = delete_local(dir.path(), "main", false).unwrap_err();
        assert!(format!("{err:?}").contains("main"));
        assert_eq!(list(dir.path()).unwrap().len(), 2);
    }

    #[test]
    fn delete_remote_rejects_a_name_without_a_remote() {
        let dir = repo_with_feature_branch();
        assert!(delete_remote(dir.path(), "feature").is_err());
    }
}
