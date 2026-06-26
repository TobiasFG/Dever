//! Installed Claude Code plugins.
//!
//! The installed set lives in `~/.claude/plugins/installed_plugins.json` under
//! `plugins`, keyed `"name@marketplace"`. The enabled-state truth read by the
//! plugin loader is `~/.claude/settings.json` → `enabledPlugins[key] == true`
//! (disabled = `false` or key absent), so we toggle that boolean.

use crate::error::AppError;
use crate::features::claude::{
    model::{Plugin, RepoPlugin},
    paths, settings,
};
use serde_json::{Map, Value};
use std::path::Path;
use tauri::AppHandle;

const ENABLED_KEY: &str = "enabledPlugins";

pub fn list(app: &AppHandle) -> Result<Vec<Plugin>, AppError> {
    list_at(
        &paths::installed_plugins_json(app)?,
        &paths::settings_json(app)?,
    )
}

pub fn set_enabled(app: &AppHandle, key: &str, enabled: bool) -> Result<(), AppError> {
    set_enabled_at(&paths::settings_json(app)?, key, enabled)
}

/// Installed plugins with their *effective* enabled state for a repo. Claude
/// Code merges `enabledPlugins` across user `settings.json`, the repo's
/// `.claude/settings.json`, then `.claude/settings.local.json` — later layers
/// win — so we apply them in that order.
pub fn list_for_repo(app: &AppHandle, repo: &Path) -> Result<Vec<RepoPlugin>, AppError> {
    list_for_repo_at(
        &paths::installed_plugins_json(app)?,
        &[
            paths::settings_json(app)?,
            paths::repo_settings(repo),
            paths::repo_settings_local(repo),
        ],
    )
}

fn list_for_repo_at(
    installed_path: &Path,
    layers: &[std::path::PathBuf],
) -> Result<Vec<RepoPlugin>, AppError> {
    let installed = settings::load_object(installed_path)?;
    let plugins = installed
        .get("plugins")
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();

    // Fold the enabled map across the settings layers, later layers overriding.
    let mut enabled: Map<String, Value> = Map::new();
    for layer in layers {
        if let Some(map) = settings::load_object(layer)?
            .get(ENABLED_KEY)
            .and_then(|v| v.as_object())
        {
            for (k, v) in map {
                enabled.insert(k.clone(), v.clone());
            }
        }
    }

    let mut result: Vec<RepoPlugin> = plugins
        .iter()
        .map(|(key, entries)| {
            let (name, marketplace) = split_key(key);
            let scope = entries
                .as_array()
                .and_then(|a| a.first())
                .and_then(|e| e.get("scope"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            RepoPlugin {
                key: key.clone(),
                name,
                marketplace,
                scope,
                enabled: enabled.get(key).and_then(|v| v.as_bool()).unwrap_or(false),
            }
        })
        .collect();
    result.sort_by_key(|p| p.name.to_lowercase());
    Ok(result)
}

/// Toggle a plugin for one repo by writing its `.claude/settings.local.json`
/// (private to this checkout), leaving user and shared settings untouched.
pub fn set_repo_enabled(repo: &Path, key: &str, enabled: bool) -> Result<(), AppError> {
    set_enabled_at(&paths::repo_settings_local(repo), key, enabled)
}

/// Split a `"name@marketplace"` registry key into its parts.
fn split_key(key: &str) -> (String, String) {
    match key.rsplit_once('@') {
        Some((name, marketplace)) => (name.to_string(), marketplace.to_string()),
        None => (key.to_string(), String::new()),
    }
}

fn list_at(installed_path: &Path, settings_path: &Path) -> Result<Vec<Plugin>, AppError> {
    let installed = settings::load_object(installed_path)?;
    let plugins = installed
        .get("plugins")
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();
    let enabled = settings::load_object(settings_path)?
        .get(ENABLED_KEY)
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();

    let mut result: Vec<Plugin> = plugins
        .iter()
        .map(|(key, entries)| {
            let (name, marketplace) = split_key(key);
            let scope = entries
                .as_array()
                .and_then(|a| a.first())
                .and_then(|e| e.get("scope"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            Plugin {
                key: key.clone(),
                name,
                marketplace,
                scope,
                enabled: enabled.get(key).and_then(|v| v.as_bool()).unwrap_or(false),
            }
        })
        .collect();
    result.sort_by_key(|p| p.name.to_lowercase());
    Ok(result)
}

fn set_enabled_at(settings_path: &Path, key: &str, enabled: bool) -> Result<(), AppError> {
    let mut map = settings::load_object(settings_path)?;
    let entry = map
        .entry(ENABLED_KEY)
        .or_insert_with(|| Value::Object(Map::new()));
    if let Some(obj) = entry.as_object_mut() {
        obj.insert(key.to_string(), Value::Bool(enabled));
    }
    settings::save_object(settings_path, &map)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn lists_plugins_with_enabled_state() {
        let tmp = tempfile::tempdir().unwrap();
        let installed = tmp.path().join("installed_plugins.json");
        let settings_path = tmp.path().join("settings.json");
        std::fs::write(
            &installed,
            serde_json::to_vec_pretty(&json!({
                "version": 2,
                "plugins": {
                    "expo@claude-plugins-official": [
                        { "scope": "project", "version": "1.3.0" }
                    ]
                }
            }))
            .unwrap(),
        )
        .unwrap();
        std::fs::write(
            &settings_path,
            serde_json::to_vec_pretty(&json!({
                "enabledPlugins": { "expo@claude-plugins-official": true }
            }))
            .unwrap(),
        )
        .unwrap();

        let plugins = list_at(&installed, &settings_path).unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].name, "expo");
        assert_eq!(plugins[0].marketplace, "claude-plugins-official");
        assert_eq!(plugins[0].scope, "project");
        assert!(plugins[0].enabled);
    }

    #[test]
    fn repo_effective_state_lets_local_layer_override_user() {
        let tmp = tempfile::tempdir().unwrap();
        let installed = tmp.path().join("installed_plugins.json");
        let user = tmp.path().join("user-settings.json");
        let project = tmp.path().join("project-settings.json");
        let local = tmp.path().join("local-settings.json");
        std::fs::write(
            &installed,
            serde_json::to_vec_pretty(&json!({
                "plugins": {
                    "a@m": [{ "scope": "user" }],
                    "b@m": [{ "scope": "user" }]
                }
            }))
            .unwrap(),
        )
        .unwrap();
        // user enables both; the repo's local layer disables `a` for this repo.
        std::fs::write(
            &user,
            serde_json::to_vec_pretty(&json!({ "enabledPlugins": { "a@m": true, "b@m": true } }))
                .unwrap(),
        )
        .unwrap();
        std::fs::write(
            &local,
            serde_json::to_vec_pretty(&json!({ "enabledPlugins": { "a@m": false } })).unwrap(),
        )
        .unwrap();

        let plugins = list_for_repo_at(&installed, &[user, project, local]).unwrap();
        let a = plugins.iter().find(|p| p.key == "a@m").unwrap();
        let b = plugins.iter().find(|p| p.key == "b@m").unwrap();
        assert!(!a.enabled, "local layer disables a for this repo");
        assert!(b.enabled, "b stays enabled from the user layer");
    }

    #[test]
    fn toggle_sets_enabled_flag_preserving_other_keys() {
        let tmp = tempfile::tempdir().unwrap();
        let settings_path = tmp.path().join("settings.json");
        std::fs::write(
            &settings_path,
            serde_json::to_vec_pretty(&json!({ "model": "claude-opus" })).unwrap(),
        )
        .unwrap();

        set_enabled_at(&settings_path, "expo@claude-plugins-official", true).unwrap();
        let map = settings::load_object(&settings_path).unwrap();
        assert_eq!(map.get("model").unwrap(), "claude-opus");
        assert_eq!(
            map.get("enabledPlugins").unwrap(),
            &json!({ "expo@claude-plugins-official": true })
        );

        set_enabled_at(&settings_path, "expo@claude-plugins-official", false).unwrap();
        let map = settings::load_object(&settings_path).unwrap();
        assert_eq!(
            map.get("enabledPlugins").unwrap(),
            &json!({ "expo@claude-plugins-official": false })
        );
    }
}
