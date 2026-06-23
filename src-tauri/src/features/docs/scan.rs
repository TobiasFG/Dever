use crate::features::docs::model::DocNode;
use std::collections::BTreeMap;
use std::path::Path;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

/// Directory names we never descend into while collecting docs.
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

/// Markdown file extensions we surface in the docs tree.
const DOC_EXTS: &[&str] = &["md", "mdx", "markdown"];

fn is_doc(name: &str) -> bool {
    match name.rsplit_once('.') {
        Some((_, ext)) => DOC_EXTS.iter().any(|e| ext.eq_ignore_ascii_case(e)),
        None => false,
    }
}

fn mtime_millis(path: &Path) -> u64 {
    path.metadata()
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Walk `repo` and return its markdown files as a depth-annotated, tree-ordered
/// flat list: each directory that contains docs appears as a grouping node
/// immediately before its children (directories first, then files, both
/// alphabetical). Paths are repo-relative with forward slashes.
pub fn collect(repo: &Path) -> Vec<DocNode> {
    // (relative-posix-path, mtime) for every doc file under the repo.
    let mut files: Vec<(String, u64)> = Vec::new();
    let mut walker = WalkDir::new(repo).into_iter();

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
        if !is_doc(name) {
            continue;
        }
        if let Ok(rel) = entry.path().strip_prefix(repo) {
            let rel = rel.to_string_lossy().replace('\\', "/");
            files.push((rel, mtime_millis(entry.path())));
        }
    }

    let mtimes: BTreeMap<String, u64> = files.iter().cloned().collect();
    let rels: Vec<String> = files.into_iter().map(|(p, _)| p).collect();
    let tree = Dir::from_paths(&rels);
    let mut out = Vec::new();
    tree.emit("", 0, &mtimes, &mut out);
    out
}

/// In-memory directory tree used to produce a stable, grouped ordering.
#[derive(Default)]
struct Dir {
    dirs: BTreeMap<String, Dir>,
    files: Vec<String>,
}

impl Dir {
    fn from_paths(paths: &[String]) -> Dir {
        let mut root = Dir::default();
        for p in paths {
            let segs: Vec<&str> = p.split('/').collect();
            let mut node = &mut root;
            for seg in &segs[..segs.len() - 1] {
                node = node.dirs.entry((*seg).to_string()).or_default();
            }
            node.files.push(segs[segs.len() - 1].to_string());
        }
        root
    }

    fn emit(
        &self,
        prefix: &str,
        depth: u32,
        mtimes: &BTreeMap<String, u64>,
        out: &mut Vec<DocNode>,
    ) {
        for (name, child) in &self.dirs {
            let path = if prefix.is_empty() {
                name.clone()
            } else {
                format!("{prefix}/{name}")
            };
            out.push(DocNode {
                name: name.clone(),
                path: path.clone(),
                is_dir: true,
                depth,
                modified: 0,
            });
            child.emit(&path, depth + 1, mtimes, out);
        }
        let mut files = self.files.clone();
        files.sort();
        for name in files {
            let path = if prefix.is_empty() {
                name.clone()
            } else {
                format!("{prefix}/{name}")
            };
            let modified = mtimes.get(&path).copied().unwrap_or(0);
            out.push(DocNode {
                name,
                path,
                is_dir: false,
                depth,
                modified,
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn is_doc_matches_markdown_extensions_only() {
        assert!(is_doc("README.md"));
        assert!(is_doc("Guide.MARKDOWN"));
        assert!(is_doc("notes.mdx"));
        assert!(!is_doc("main.rs"));
        assert!(!is_doc("Makefile"));
    }

    #[test]
    fn collect_groups_dirs_before_files_and_prunes_noise() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path();
        fs::write(root.join("README.md"), "# readme").unwrap();
        fs::create_dir_all(root.join("docs/guides")).unwrap();
        fs::write(root.join("docs/ARCHITECTURE.md"), "# arch").unwrap();
        fs::write(root.join("docs/guides/add.md"), "# add").unwrap();
        // Noise that must be skipped.
        fs::create_dir_all(root.join("node_modules/pkg")).unwrap();
        fs::write(root.join("node_modules/pkg/readme.md"), "x").unwrap();
        fs::write(root.join("src.rs"), "fn main(){}").unwrap();

        let nodes = collect(root);
        let shape: Vec<(String, bool, u32)> = nodes
            .iter()
            .map(|n| (n.path.clone(), n.is_dir, n.depth))
            .collect();

        assert_eq!(
            shape,
            vec![
                ("docs".to_string(), true, 0),
                ("docs/guides".to_string(), true, 1),
                ("docs/guides/add.md".to_string(), false, 2),
                ("docs/ARCHITECTURE.md".to_string(), false, 1),
                ("README.md".to_string(), false, 0),
            ]
        );
    }
}
