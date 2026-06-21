use crate::error::AppError;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn home(app: &AppHandle) -> Result<PathBuf, AppError> {
    app.path()
        .home_dir()
        .map_err(|e| AppError::new(e.to_string()))
}

/// `~/.claude/` — the Claude Code user data directory.
pub fn claude_dir(app: &AppHandle) -> Result<PathBuf, AppError> {
    Ok(home(app)?.join(".claude"))
}

/// `~/.claude.json` — holds user-scoped `mcpServers` (among much else).
pub fn claude_json(app: &AppHandle) -> Result<PathBuf, AppError> {
    Ok(home(app)?.join(".claude.json"))
}

/// `~/.claude/CLAUDE.md` — the global memory / system prompt file.
pub fn claude_md(app: &AppHandle) -> Result<PathBuf, AppError> {
    Ok(claude_dir(app)?.join("CLAUDE.md"))
}

/// `~/.claude/settings.json` — holds `enabledPlugins` (the plugin loader's truth).
pub fn settings_json(app: &AppHandle) -> Result<PathBuf, AppError> {
    Ok(claude_dir(app)?.join("settings.json"))
}

/// `~/.claude/plugins/installed_plugins.json` — the installed-plugin registry.
pub fn installed_plugins_json(app: &AppHandle) -> Result<PathBuf, AppError> {
    Ok(claude_dir(app)?
        .join("plugins")
        .join("installed_plugins.json"))
}
