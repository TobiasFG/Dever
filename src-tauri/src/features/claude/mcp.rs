//! User-scoped MCP servers, defined in `~/.claude.json` under `mcpServers`.
//!
//! Claude Code has no enabled/disabled flag for user-scoped servers — presence
//! in `mcpServers` means active. To disable one reversibly we move its full
//! definition out of `~/.claude.json` into a Dever-owned stash file under the
//! app config dir, and move it back to re-enable. The live config stays clean.

use crate::error::AppError;
use crate::features::claude::{model::McpServer, paths, settings};
use serde_json::{Map, Value};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const MCP_KEY: &str = "mcpServers";

fn stash_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::new(e.to_string()))?;
    Ok(dir.join("claude-mcp-disabled.json"))
}

/// A short sub-text for the server row — its launch command, when present.
fn command_of(def: &Value) -> String {
    def.get("command")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

pub fn list(app: &AppHandle) -> Result<Vec<McpServer>, AppError> {
    list_at(&paths::claude_json(app)?, &stash_path(app)?)
}

pub fn set_enabled(app: &AppHandle, name: &str, enabled: bool) -> Result<(), AppError> {
    set_enabled_at(&paths::claude_json(app)?, &stash_path(app)?, name, enabled)
}

/// Merge the live `mcpServers` (enabled) with the stash (disabled), sorted.
fn list_at(claude_json: &Path, stash: &Path) -> Result<Vec<McpServer>, AppError> {
    let root = settings::load_object(claude_json)?;
    let active = root
        .get(MCP_KEY)
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();
    let disabled = settings::load_object(stash)?;

    let mut servers: Vec<McpServer> = active
        .iter()
        .map(|(name, def)| McpServer {
            name: name.clone(),
            command: command_of(def),
            enabled: true,
        })
        .chain(disabled.iter().map(|(name, def)| McpServer {
            name: name.clone(),
            command: command_of(def),
            enabled: false,
        }))
        .collect();
    servers.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(servers)
}

/// Move a server definition between the live config and the stash.
fn set_enabled_at(
    claude_json: &Path,
    stash: &Path,
    name: &str,
    enabled: bool,
) -> Result<(), AppError> {
    let mut root = settings::load_object(claude_json)?;
    let mut disabled = settings::load_object(stash)?;

    if enabled {
        if let Some(def) = disabled.remove(name) {
            let servers = root
                .entry(MCP_KEY)
                .or_insert_with(|| Value::Object(Map::new()));
            if let Some(obj) = servers.as_object_mut() {
                obj.insert(name.to_string(), def);
            }
        }
    } else if let Some(obj) = root.get_mut(MCP_KEY).and_then(|v| v.as_object_mut()) {
        if let Some(def) = obj.remove(name) {
            disabled.insert(name.to_string(), def);
        }
    }

    settings::save_object(claude_json, &root)?;
    settings::save_object(stash, &disabled)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn write_json(path: &Path, value: &Value) {
        std::fs::write(path, serde_json::to_vec_pretty(value).unwrap()).unwrap();
    }

    #[test]
    fn disable_then_enable_restores_definition() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let stash = tmp.path().join("stash.json");
        write_json(
            &claude_json,
            &json!({
                "numStartups": 3,
                "mcpServers": {
                    "github": { "command": "npx", "args": ["-y", "server-github"] }
                }
            }),
        );

        set_enabled_at(&claude_json, &stash, "github", false).unwrap();
        // Left the live config but kept the unrelated key.
        let root = settings::load_object(&claude_json).unwrap();
        assert_eq!(root.get("numStartups").unwrap(), 3);
        assert!(root
            .get("mcpServers")
            .unwrap()
            .as_object()
            .unwrap()
            .is_empty());
        let listed = list_at(&claude_json, &stash).unwrap();
        assert_eq!(listed.len(), 1);
        assert!(!listed[0].enabled);

        set_enabled_at(&claude_json, &stash, "github", true).unwrap();
        let restored = settings::load_object(&claude_json).unwrap();
        assert_eq!(
            restored.get("mcpServers").unwrap(),
            &json!({ "github": { "command": "npx", "args": ["-y", "server-github"] } })
        );
        let listed = list_at(&claude_json, &stash).unwrap();
        assert_eq!(listed.len(), 1);
        assert!(listed[0].enabled);
        assert_eq!(listed[0].command, "npx");
    }

    #[test]
    fn list_is_empty_when_no_config() {
        let tmp = tempfile::tempdir().unwrap();
        let listed = list_at(
            &tmp.path().join(".claude.json"),
            &tmp.path().join("stash.json"),
        )
        .unwrap();
        assert!(listed.is_empty());
    }
}
