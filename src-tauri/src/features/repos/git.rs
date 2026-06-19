use crate::error::AppError;
use std::path::Path;
use std::process::Command;

/// Parsed result of `git status --porcelain=v2 --branch` for one repo.
#[derive(Debug, Default, PartialEq)]
pub struct ParsedStatus {
    pub branch: Option<String>,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub changes: u32,
    pub conflict: bool,
    pub detached: bool,
}

/// Run git for a repo and parse its status. Shells out to the user's `git` so
/// their config, credential helpers, and SSH keys all apply.
pub fn status(path: &Path) -> Result<ParsedStatus, AppError> {
    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(["status", "--porcelain=v2", "--branch"])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::new(format!(
            "git status failed in {}: {}",
            path.display(),
            stderr.trim()
        )));
    }

    Ok(parse_porcelain_v2(&String::from_utf8_lossy(&output.stdout)))
}

/// Pure parser for porcelain v2 output. See `git status` docs for the format:
/// header lines start with `# branch.*`; entry lines start with `1`/`2` (changed),
/// `u` (unmerged), or `?` (untracked).
pub fn parse_porcelain_v2(output: &str) -> ParsedStatus {
    let mut s = ParsedStatus::default();
    for line in output.lines() {
        if let Some(rest) = line.strip_prefix("# branch.head ") {
            if rest == "(detached)" {
                s.detached = true;
            } else {
                s.branch = Some(rest.to_string());
            }
        } else if let Some(rest) = line.strip_prefix("# branch.upstream ") {
            s.upstream = Some(rest.to_string());
        } else if let Some(rest) = line.strip_prefix("# branch.ab ") {
            for tok in rest.split_whitespace() {
                if let Some(a) = tok.strip_prefix('+') {
                    s.ahead = a.parse().unwrap_or(0);
                } else if let Some(b) = tok.strip_prefix('-') {
                    s.behind = b.parse().unwrap_or(0);
                }
            }
        } else if line.starts_with("1 ") || line.starts_with("2 ") || line.starts_with("? ") {
            s.changes += 1;
        } else if line.starts_with("u ") {
            s.changes += 1;
            s.conflict = true;
        }
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clean_tracking_branch() {
        let out = "# branch.oid abc123\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +0 -0\n";
        let s = parse_porcelain_v2(out);
        assert_eq!(s.branch.as_deref(), Some("main"));
        assert_eq!(s.upstream.as_deref(), Some("origin/main"));
        assert_eq!(s.ahead, 0);
        assert_eq!(s.behind, 0);
        assert_eq!(s.changes, 0);
        assert!(!s.conflict);
        assert!(!s.detached);
    }

    #[test]
    fn ahead_behind_with_changes_and_untracked() {
        let out = "# branch.head feat\n# branch.upstream origin/feat\n# branch.ab +2 -3\n\
                   1 .M N... 100644 100644 100644 aaa bbb tracked.txt\n\
                   ? untracked.txt\n";
        let s = parse_porcelain_v2(out);
        assert_eq!(s.ahead, 2);
        assert_eq!(s.behind, 3);
        assert_eq!(s.changes, 2);
        assert!(!s.conflict);
    }

    #[test]
    fn unmerged_marks_conflict() {
        let out = "# branch.head main\n# branch.ab +0 -0\n\
                   u UU N... 100644 100644 100644 100644 a b c d both.txt\n";
        let s = parse_porcelain_v2(out);
        assert_eq!(s.changes, 1);
        assert!(s.conflict);
    }

    #[test]
    fn detached_head_has_no_branch() {
        let out = "# branch.oid abc123\n# branch.head (detached)\n";
        let s = parse_porcelain_v2(out);
        assert!(s.detached);
        assert_eq!(s.branch, None);
    }
}
