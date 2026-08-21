use serde::Serialize;

/// A discovered git repository and its current status. Mirrored in
/// `src-ui/features/repos/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Repo {
    pub name: String,
    pub path: String,
    pub branch: Option<String>,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub changes: u32,
    pub conflict: bool,
    pub detached: bool,
}

/// A git branch (local or remote) for the switch-branch combobox. Mirrored in
/// `src-ui/features/repos/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Branch {
    pub name: String,
    pub is_remote: bool,
    pub is_current: bool,
    pub upstream: Option<String>,
}

/// An editor installed on this machine that a repo can be opened in. Mirrored
/// in `src-ui/features/repos/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Editor {
    pub id: String,
    pub name: String,
}

/// Whether a Visual Studio target is a solution file or a bare project file.
/// Mirrored in `src-ui/features/repos/types.ts` — change both together.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SolutionKind {
    Solution,
    Project,
}

/// A `.sln` or `.csproj` file in a repo that Visual Studio can open. Mirrored
/// in `src-ui/features/repos/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Solution {
    /// Absolute path to the file — this is what Visual Studio is handed.
    pub path: String,
    /// Display name (the file name).
    pub name: String,
    /// Path relative to the repo root, with forward slashes.
    pub rel_path: String,
    pub kind: SolutionKind,
}
