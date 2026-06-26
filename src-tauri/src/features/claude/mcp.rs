//! User-scoped MCP servers, defined in `~/.claude.json` under `mcpServers`.
//!
//! Claude Code has no enabled/disabled flag for user-scoped servers — presence
//! in `mcpServers` means active. To disable one reversibly we move its full
//! definition out of `~/.claude.json` into a Dever-owned stash file under the
//! app config dir, and move it back to re-enable. The live config stays clean.

use crate::error::AppError;
use crate::features::claude::{
    model::{McpServer, RepoMcpServer},
    paths, settings,
};
use serde_json::{Map, Value};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const MCP_KEY: &str = "mcpServers";
const DISABLED_USER_KEY: &str = "disabledMcpServers";
const ENABLED_PROJECT_KEY: &str = "enabledMcpjsonServers";
const DISABLED_PROJECT_KEY: &str = "disabledMcpjsonServers";

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

/// The per-repo stash for disabled *local*-scope servers, shaped
/// `{ "<project key>": { "<name>": <definition> } }`.
fn local_stash_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::new(e.to_string()))?;
    Ok(dir.join("claude-mcp-local-disabled.json"))
}

/// Read a string array under `key` as a set of names (absent → empty).
fn name_set(obj: &Map<String, Value>, key: &str) -> Vec<String> {
    obj.get(key)
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

pub fn list_for_repo(app: &AppHandle, repo: &Path) -> Result<Vec<RepoMcpServer>, AppError> {
    let claude_json = paths::claude_json(app)?;
    let key = paths::project_key(repo);
    list_for_repo_at(
        &claude_json,
        &paths::repo_mcp_json(repo),
        &local_stash_path(app)?,
        &key,
        &project_approval(
            &claude_json,
            &key,
            &paths::settings_json(app)?,
            &paths::repo_settings(repo),
            &paths::repo_settings_local(repo),
        )?,
    )
}

/// Claude Code resolves `.mcp.json` approval from several settings sources. We
/// model the merged result: the `enableAllProjectMcpServers` default plus the
/// explicit enabled/disabled name lists, layered low → high precedence so the
/// highest layer wins per server.
struct ProjectApproval {
    enable_all: bool,
    /// `(enabled, disabled)` name lists, ordered low → high precedence.
    layers: Vec<(Vec<String>, Vec<String>)>,
}

impl ProjectApproval {
    /// Effective enabled state for one project server name.
    fn enabled(&self, name: &str) -> bool {
        let mut state = self.enable_all;
        for (enabled, disabled) in &self.layers {
            if disabled.iter().any(|n| n == name) {
                state = false;
            }
            if enabled.iter().any(|n| n == name) {
                state = true;
            }
        }
        state
    }
}

/// Build the merged project approval across, low → high precedence: user
/// `settings.json`, `~/.claude.json` `projects[key]` (legacy), the repo's
/// `settings.json`, then `settings.local.json`.
fn project_approval(
    claude_json: &Path,
    key: &str,
    user_settings: &Path,
    repo_settings: &Path,
    repo_settings_local: &Path,
) -> Result<ProjectApproval, AppError> {
    let claude_root = settings::load_object(claude_json)?;
    let legacy = claude_root
        .get("projects")
        .and_then(|v| v.as_object())
        .and_then(|p| p.get(key))
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();
    let user = settings::load_object(user_settings)?;
    let proj = settings::load_object(repo_settings)?;
    let local = settings::load_object(repo_settings_local)?;
    let ordered = [&user, &legacy, &proj, &local];

    let mut enable_all = false;
    for obj in ordered {
        if let Some(v) = obj
            .get("enableAllProjectMcpServers")
            .and_then(|v| v.as_bool())
        {
            enable_all = v;
        }
    }
    let layers = ordered
        .iter()
        .map(|obj| {
            (
                name_set(obj, ENABLED_PROJECT_KEY),
                name_set(obj, DISABLED_PROJECT_KEY),
            )
        })
        .collect();
    Ok(ProjectApproval { enable_all, layers })
}

/// Gather every MCP server visible to a repo across all three scopes, each
/// tagged with its scope and effective enabled state for this repo.
fn list_for_repo_at(
    claude_json: &Path,
    mcp_json: &Path,
    local_stash: &Path,
    key: &str,
    approval: &ProjectApproval,
) -> Result<Vec<RepoMcpServer>, AppError> {
    let root = settings::load_object(claude_json)?;
    let project = root
        .get("projects")
        .and_then(|v| v.as_object())
        .and_then(|p| p.get(key))
        .and_then(|v| v.as_object());

    let mut out: Vec<RepoMcpServer> = Vec::new();

    // user scope — top-level mcpServers, disabled per-repo by name.
    let disabled_user = project
        .map(|p| name_set(p, DISABLED_USER_KEY))
        .unwrap_or_default();
    if let Some(servers) = root.get(MCP_KEY).and_then(|v| v.as_object()) {
        for (name, def) in servers {
            out.push(RepoMcpServer {
                name: name.clone(),
                command: command_of(def),
                scope: "user".into(),
                enabled: !disabled_user.contains(name),
            });
        }
    }
    // user scope — names disabled for this repo that have no local definition
    // (e.g. claude.ai connectors, account-managed). Surfaced so they can be
    // re-enabled; we can't enumerate the enabled ones from files.
    let defined: Vec<String> = root
        .get(MCP_KEY)
        .and_then(|v| v.as_object())
        .map(|m| m.keys().cloned().collect())
        .unwrap_or_default();
    for name in &disabled_user {
        if !defined.contains(name) {
            out.push(RepoMcpServer {
                name: name.clone(),
                command: "claude.ai connector".into(),
                scope: "user".into(),
                enabled: false,
            });
        }
    }

    // project scope — the repo's .mcp.json; enabled state resolved from the
    // merged settings layers (see ProjectApproval).
    if let Some(servers) = settings::load_object(mcp_json)?
        .get(MCP_KEY)
        .and_then(|v| v.as_object())
    {
        for (name, def) in servers {
            out.push(RepoMcpServer {
                name: name.clone(),
                command: command_of(def),
                scope: "project".into(),
                enabled: approval.enabled(name),
            });
        }
    }

    // local scope — projects[key].mcpServers (active) plus the per-repo stash (disabled).
    if let Some(servers) = project
        .and_then(|p| p.get(MCP_KEY))
        .and_then(|v| v.as_object())
    {
        for (name, def) in servers {
            out.push(RepoMcpServer {
                name: name.clone(),
                command: command_of(def),
                scope: "local".into(),
                enabled: true,
            });
        }
    }
    if let Some(stashed) = settings::load_object(local_stash)?
        .get(key)
        .and_then(|v| v.as_object())
    {
        for (name, def) in stashed {
            out.push(RepoMcpServer {
                name: name.clone(),
                command: command_of(def),
                scope: "local".into(),
                enabled: false,
            });
        }
    }

    out.sort_by(|a, b| {
        scope_rank(&a.scope)
            .cmp(&scope_rank(&b.scope))
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(out)
}

fn scope_rank(scope: &str) -> u8 {
    match scope {
        "project" => 0,
        "local" => 1,
        _ => 2, // user
    }
}

pub fn set_repo_enabled(
    app: &AppHandle,
    repo: &Path,
    name: &str,
    scope: &str,
    enabled: bool,
) -> Result<(), AppError> {
    set_repo_enabled_at(
        &paths::claude_json(app)?,
        &local_stash_path(app)?,
        &paths::repo_settings_local(repo),
        &paths::project_key(repo),
        name,
        scope,
        enabled,
    )
}

fn set_repo_enabled_at(
    claude_json: &Path,
    local_stash: &Path,
    repo_settings_local: &Path,
    key: &str,
    name: &str,
    scope: &str,
    enabled: bool,
) -> Result<(), AppError> {
    let mut root = settings::load_object(claude_json)?;
    match scope {
        // Disabled = listed in disabledMcpServers; enabled = absent from it.
        "user" => {
            let entry = project_entry(&mut root, key);
            if enabled {
                array_remove(entry, DISABLED_USER_KEY, name);
            } else {
                array_add(entry, DISABLED_USER_KEY, name);
            }
            settings::save_object(claude_json, &root)?;
        }
        // Project approval is a *settings* value; Claude Code keeps it in the
        // repo's settings.local.json (the highest-precedence layer). Write there
        // and drop any stale entry from the legacy ~/.claude.json projects map so
        // the two can't disagree.
        "project" => {
            let mut local = settings::load_object(repo_settings_local)?;
            if enabled {
                array_add(&mut local, ENABLED_PROJECT_KEY, name);
                array_remove(&mut local, DISABLED_PROJECT_KEY, name);
            } else {
                array_add(&mut local, DISABLED_PROJECT_KEY, name);
                array_remove(&mut local, ENABLED_PROJECT_KEY, name);
            }
            settings::save_object(repo_settings_local, &local)?;

            let entry = project_entry(&mut root, key);
            array_remove(entry, ENABLED_PROJECT_KEY, name);
            array_remove(entry, DISABLED_PROJECT_KEY, name);
            settings::save_object(claude_json, &root)?;
        }
        // Move the definition between the live projects map and the stash.
        "local" => {
            let mut stash = settings::load_object(local_stash)?;
            if enabled {
                let def = stash
                    .get_mut(key)
                    .and_then(|v| v.as_object_mut())
                    .and_then(|m| m.remove(name));
                if let Some(def) = def {
                    let entry = project_entry(&mut root, key);
                    let servers = entry
                        .entry(MCP_KEY)
                        .or_insert_with(|| Value::Object(Map::new()));
                    if let Some(obj) = servers.as_object_mut() {
                        obj.insert(name.to_string(), def);
                    }
                }
            } else {
                let def = project_entry(&mut root, key)
                    .get_mut(MCP_KEY)
                    .and_then(|v| v.as_object_mut())
                    .and_then(|m| m.remove(name));
                if let Some(def) = def {
                    let bucket = stash
                        .entry(key.to_string())
                        .or_insert_with(|| Value::Object(Map::new()));
                    if let Some(obj) = bucket.as_object_mut() {
                        obj.insert(name.to_string(), def);
                    }
                }
            }
            settings::save_object(claude_json, &root)?;
            settings::save_object(local_stash, &stash)?;
        }
        other => return Err(AppError::new(format!("unknown mcp scope: {other}"))),
    }
    Ok(())
}

/// Borrow (creating if needed) `projects[key]` as a mutable object.
fn project_entry<'a>(root: &'a mut Map<String, Value>, key: &str) -> &'a mut Map<String, Value> {
    let projects = root
        .entry("projects")
        .or_insert_with(|| Value::Object(Map::new()));
    let projects = projects.as_object_mut().expect("projects is an object");
    let entry = projects
        .entry(key.to_string())
        .or_insert_with(|| Value::Object(Map::new()));
    entry.as_object_mut().expect("project entry is an object")
}

/// Insert `name` into the string array under `key` if absent (creating the array).
fn array_add(obj: &mut Map<String, Value>, key: &str, name: &str) {
    let arr = obj.entry(key).or_insert_with(|| Value::Array(Vec::new()));
    if let Some(list) = arr.as_array_mut() {
        if !list.iter().any(|v| v.as_str() == Some(name)) {
            list.push(Value::String(name.to_string()));
        }
    }
}

/// Remove every occurrence of `name` from the string array under `key`.
fn array_remove(obj: &mut Map<String, Value>, key: &str, name: &str) {
    if let Some(list) = obj.get_mut(key).and_then(|v| v.as_array_mut()) {
        list.retain(|v| v.as_str() != Some(name));
    }
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
    servers.sort_by_key(|s| s.name.to_lowercase());
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

    const KEY: &str = "C:/src/Repo";

    /// A ProjectApproval with one layer (the common single-source case).
    fn approval(enable_all: bool, enabled: &[&str], disabled: &[&str]) -> ProjectApproval {
        ProjectApproval {
            enable_all,
            layers: vec![(
                enabled.iter().map(|s| s.to_string()).collect(),
                disabled.iter().map(|s| s.to_string()).collect(),
            )],
        }
    }

    #[test]
    fn repo_list_tags_each_scope_with_effective_state() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let mcp_json = tmp.path().join(".mcp.json");
        let stash = tmp.path().join("local-stash.json");
        write_json(
            &claude_json,
            &json!({
                "mcpServers": {
                    "github": { "command": "npx" },
                    "linear": { "command": "npx" }
                },
                "projects": {
                    KEY: {
                        "mcpServers": { "scratch": { "command": "node" } },
                        "disabledMcpServers": ["linear", "claude.ai Vercel"]
                    }
                }
            }),
        );
        write_json(
            &mcp_json,
            &json!({
                "mcpServers": {
                    "review-intent": { "command": "review-intent" },
                    "pending": { "command": "x" }
                }
            }),
        );

        let listed = list_for_repo_at(
            &claude_json,
            &mcp_json,
            &stash,
            KEY,
            &approval(false, &["review-intent"], &[]),
        )
        .unwrap();
        let find = |name: &str| listed.iter().find(|s| s.name == name).unwrap();

        // user: github not disabled → on; linear disabled-for-repo → off.
        assert!(find("github").enabled && find("github").scope == "user");
        assert!(!find("linear").enabled);
        // user: a disabled name with no local definition still surfaces (connector).
        assert!(!find("claude.ai Vercel").enabled);
        assert_eq!(find("claude.ai Vercel").command, "claude.ai connector");
        // project: approved → on; not in either list → off.
        assert!(find("review-intent").enabled && find("review-intent").scope == "project");
        assert!(!find("pending").enabled);
        // local: present in projects[key].mcpServers → on.
        assert!(find("scratch").enabled && find("scratch").scope == "local");
    }

    #[test]
    fn enable_all_project_auto_approves_unless_explicitly_disabled() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let mcp_json = tmp.path().join(".mcp.json");
        let stash = tmp.path().join("local-stash.json");
        write_json(&claude_json, &json!({}));
        write_json(
            &mcp_json,
            &json!({
                "mcpServers": {
                    "auto": { "command": "x" },
                    "blocked": { "command": "x" }
                }
            }),
        );

        // With the flag on, `auto` is approved without an enabled entry, but an
        // explicit disable still wins.
        let listed = list_for_repo_at(
            &claude_json,
            &mcp_json,
            &stash,
            KEY,
            &approval(true, &[], &["blocked"]),
        )
        .unwrap();
        let find = |name: &str| listed.iter().find(|s| s.name == name).unwrap();
        assert!(find("auto").enabled);
        assert!(!find("blocked").enabled);
    }

    #[test]
    fn project_approval_merges_layers_with_local_winning() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let user = tmp.path().join("settings.json");
        let proj = tmp.path().join("project.json");
        let local = tmp.path().join("local.json");
        // Legacy layer lives in ~/.claude.json projects[key].
        write_json(
            &claude_json,
            &json!({ "projects": { KEY: { "disabledMcpjsonServers": ["ri"] } } }),
        );
        write_json(&user, &json!({ "enableAllProjectMcpServers": true }));
        write_json(&proj, &json!({}));
        // The highest layer re-enables what the legacy layer disabled.
        write_json(&local, &json!({ "enabledMcpjsonServers": ["ri"] }));

        let a = project_approval(&claude_json, KEY, &user, &proj, &local).unwrap();
        assert!(a.enable_all);
        assert!(a.enabled("ri"), "local enable beats legacy disable");
        assert!(a.enabled("other"), "enable_all covers unlisted servers");
    }

    #[test]
    fn toggle_user_scope_edits_disabled_list_per_repo() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let stash = tmp.path().join("local-stash.json");
        let local = tmp.path().join("settings.local.json");
        write_json(
            &claude_json,
            &json!({ "mcpServers": { "github": { "command": "npx" } } }),
        );

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "github", "user", false).unwrap();
        let root = settings::load_object(&claude_json).unwrap();
        let disabled = root["projects"][KEY]["disabledMcpServers"]
            .as_array()
            .unwrap();
        assert_eq!(disabled, &vec![json!("github")]);

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "github", "user", true).unwrap();
        let root = settings::load_object(&claude_json).unwrap();
        assert!(root["projects"][KEY]["disabledMcpServers"]
            .as_array()
            .unwrap()
            .is_empty());
    }

    #[test]
    fn toggle_project_scope_writes_settings_local_and_clears_legacy() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let stash = tmp.path().join("local-stash.json");
        let local = tmp.path().join("settings.local.json");
        // A stale legacy entry (e.g. an older Dever write) that must be cleaned up.
        write_json(
            &claude_json,
            &json!({ "projects": { KEY: { "disabledMcpjsonServers": ["ri"] } } }),
        );

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "ri", "project", true).unwrap();
        let settings_local = settings::load_object(&local).unwrap();
        assert_eq!(
            settings_local["enabledMcpjsonServers"].as_array().unwrap(),
            &vec![json!("ri")]
        );
        // Legacy entry cleared so the two sources can't disagree.
        let root = settings::load_object(&claude_json).unwrap();
        assert!(root["projects"][KEY]["disabledMcpjsonServers"]
            .as_array()
            .unwrap()
            .is_empty());

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "ri", "project", false).unwrap();
        let settings_local = settings::load_object(&local).unwrap();
        assert!(settings_local["enabledMcpjsonServers"]
            .as_array()
            .unwrap()
            .is_empty());
        assert_eq!(
            settings_local["disabledMcpjsonServers"].as_array().unwrap(),
            &vec![json!("ri")]
        );
    }

    #[test]
    fn toggle_local_scope_stashes_and_restores_definition() {
        let tmp = tempfile::tempdir().unwrap();
        let claude_json = tmp.path().join(".claude.json");
        let stash = tmp.path().join("local-stash.json");
        let local = tmp.path().join("settings.local.json");
        write_json(
            &claude_json,
            &json!({
                "projects": { KEY: { "mcpServers": { "scratch": { "command": "node" } } } }
            }),
        );

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "scratch", "local", false).unwrap();
        let root = settings::load_object(&claude_json).unwrap();
        assert!(root["projects"][KEY]["mcpServers"]
            .as_object()
            .unwrap()
            .is_empty());
        let stashed = settings::load_object(&stash).unwrap();
        assert_eq!(stashed[KEY]["scratch"], json!({ "command": "node" }));

        set_repo_enabled_at(&claude_json, &stash, &local, KEY, "scratch", "local", true).unwrap();
        let root = settings::load_object(&claude_json).unwrap();
        assert_eq!(
            root["projects"][KEY]["mcpServers"]["scratch"],
            json!({ "command": "node" })
        );
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
