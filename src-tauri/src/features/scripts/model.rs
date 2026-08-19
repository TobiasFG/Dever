use serde::Serialize;

/// The interpreter family a script is run with, chosen by its file extension.
/// Mirrored in `src-ui/features/scripts/types.ts` — change both together.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ScriptKind {
    PowerShell,
    Shell,
    Batch,
    Python,
    Node,
}

/// Whether a script belongs to a specific repository or the global folder.
/// Mirrored in `src-ui/features/scripts/types.ts` — change both together.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ScriptScope {
    Repo,
    Global,
}

/// A runnable script discovered under a scripts folder. Mirrored in
/// `src-ui/features/scripts/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Script {
    /// Absolute path to the script file.
    pub path: String,
    /// Display name (the file name).
    pub name: String,
    /// Path relative to the scanned root, with forward slashes.
    pub rel_path: String,
    pub kind: ScriptKind,
    pub scope: ScriptScope,
}

/// The captured result of running a script to completion. A non-zero exit is a
/// valid result (`success: false`), not an error. Mirrored in
/// `src-ui/features/scripts/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptResult {
    /// Process exit code, or `None` if it was terminated by a signal.
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
    /// True when the process exited with code 0.
    pub success: bool,
}
