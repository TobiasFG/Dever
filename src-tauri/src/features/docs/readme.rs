use std::path::{Path, PathBuf};

/// Readme file names we recognise at a repo's root, in preference order.
const README_NAMES: &[&str] = &[
    "README.md",
    "README.markdown",
    "README.mdx",
    "readme.md",
    "Readme.md",
    "README",
];

/// Find the repo's top-level readme, if it has one. Names are matched
/// case-insensitively against `README_NAMES`, preferring earlier entries.
pub fn find(repo: &Path) -> Option<PathBuf> {
    let entries: Vec<String> = std::fs::read_dir(repo)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();

    README_NAMES.iter().find_map(|want| {
        entries
            .iter()
            .find(|name| name.eq_ignore_ascii_case(want))
            .map(|name| repo.join(name))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn find_returns_none_without_a_readme() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("main.rs"), "fn main(){}").unwrap();
        assert!(find(tmp.path()).is_none());
    }

    #[test]
    fn find_matches_case_insensitively() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("ReAdMe.MD"), "# hi").unwrap();
        assert_eq!(find(tmp.path()).unwrap().file_name().unwrap(), "ReAdMe.MD");
    }

    #[test]
    fn find_prefers_markdown_over_extensionless() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("README"), "plain").unwrap();
        fs::write(tmp.path().join("README.md"), "# md").unwrap();
        assert_eq!(find(tmp.path()).unwrap().file_name().unwrap(), "README.md");
    }

    #[test]
    fn find_ignores_nested_readmes() {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir(tmp.path().join("docs")).unwrap();
        fs::write(tmp.path().join("docs/README.md"), "# nested").unwrap();
        assert!(find(tmp.path()).is_none());
    }
}
