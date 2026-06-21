use crate::features::claude::paths;
use std::process::Command;
use tauri::AppHandle;

/// Whether Claude Code is installed: the `~/.claude/` data dir exists, or the
/// `claude` binary resolves on `PATH`. Either signal is enough.
pub fn is_installed(app: &AppHandle) -> bool {
    if paths::claude_dir(app).map(|p| p.exists()).unwrap_or(false) {
        return true;
    }
    binary_on_path()
}

fn binary_on_path() -> bool {
    let finder = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    Command::new(finder)
        .arg("claude")
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false)
}
