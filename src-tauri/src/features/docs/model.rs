use serde::Serialize;

/// One entry in a repo's documentation tree — either a directory grouping or a
/// markdown file. Mirrored in `src-ui/features/docs/types.ts` — change both
/// together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocNode {
    /// Repo-relative, forward-slash path (the directory or file).
    pub path: String,
    /// Display name (the final path segment).
    pub name: String,
    /// True for a directory grouping, false for a markdown file.
    pub is_dir: bool,
    /// Nesting depth from the repo root (root entries are 0).
    pub depth: u32,
    /// File modification time as Unix epoch milliseconds (0 for directories).
    pub modified: u64,
}

/// The rendered contents of a single documentation file. Mirrored in
/// `src-ui/features/docs/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocFile {
    /// Repo-relative, forward-slash path.
    pub path: String,
    /// Raw markdown source.
    pub content: String,
    /// File modification time as Unix epoch milliseconds.
    pub modified: u64,
}
