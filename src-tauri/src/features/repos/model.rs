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
