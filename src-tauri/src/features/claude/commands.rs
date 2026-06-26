use crate::error::AppError;
use crate::features::claude::{
    claude_md, detect, mcp, model::ClaudeStatus, model::RepoClaude, plugins,
};
use std::path::Path;
use tauri::AppHandle;

/// One batched read of the machine's Claude Code configuration. When Claude
/// Code isn't detected, MCP/plugin lists are empty.
#[tauri::command]
pub fn claude_status(app: AppHandle) -> Result<ClaudeStatus, AppError> {
    let detected = detect::is_installed(&app);
    let system_prompt = claude_md::info(&app)?;
    if !detected {
        return Ok(ClaudeStatus {
            detected: false,
            system_prompt,
            mcp: Vec::new(),
            plugins: Vec::new(),
        });
    }
    Ok(ClaudeStatus {
        detected: true,
        system_prompt,
        mcp: mcp::list(&app)?,
        plugins: plugins::list(&app)?,
    })
}

#[tauri::command]
pub fn read_global_claude_md(app: AppHandle) -> Result<String, AppError> {
    claude_md::read(&app)
}

#[tauri::command]
pub fn write_global_claude_md(app: AppHandle, content: String) -> Result<(), AppError> {
    claude_md::write(&app, &content)
}

#[tauri::command]
pub fn set_mcp_enabled(app: AppHandle, name: String, enabled: bool) -> Result<(), AppError> {
    mcp::set_enabled(&app, &name, enabled)
}

#[tauri::command]
pub fn set_plugin_enabled(app: AppHandle, key: String, enabled: bool) -> Result<(), AppError> {
    plugins::set_enabled(&app, &key, enabled)
}

/// Everything Claude Code applies in one repo: MCP servers across user/project/
/// local scope and plugins with their effective per-repo enabled state.
#[tauri::command]
pub fn repo_claude(app: AppHandle, path: String) -> Result<RepoClaude, AppError> {
    let repo = Path::new(&path);
    Ok(RepoClaude {
        mcp: mcp::list_for_repo(&app, repo)?,
        plugins: plugins::list_for_repo(&app, repo)?,
    })
}

/// Enable/disable an MCP server for one repo. `scope` is `user`, `project`, or
/// `local`; each is toggled by its own mechanism (see `RepoMcpServer`).
#[tauri::command]
pub fn set_repo_mcp_enabled(
    app: AppHandle,
    path: String,
    name: String,
    scope: String,
    enabled: bool,
) -> Result<(), AppError> {
    mcp::set_repo_enabled(&app, Path::new(&path), &name, &scope, enabled)
}

/// Enable/disable a plugin for one repo (writes its `.claude/settings.local.json`).
#[tauri::command]
pub fn set_repo_plugin_enabled(path: String, key: String, enabled: bool) -> Result<(), AppError> {
    plugins::set_repo_enabled(Path::new(&path), &key, enabled)
}
