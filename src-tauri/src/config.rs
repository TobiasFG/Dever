use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Persisted settings, stored as JSON under the app config dir.
#[derive(Serialize, Deserialize)]
struct Store {
    roots: Vec<String>,
    /// User-defined repo ordering for the dashboard, as a list of repo paths.
    /// Repos not listed here fall back to alphabetical order. `default` keeps
    /// older config files (which only had `roots`) loading cleanly.
    #[serde(default)]
    order: Vec<String>,
    /// The global scripts folder the user picked, if any. `default` keeps older
    /// config files (without this field) loading cleanly.
    #[serde(default)]
    scripts_root: Option<String>,
    /// Whether linked git worktrees show up in the repository list. On by
    /// default so the list keeps showing everything it always has; `default`
    /// keeps older config files (without this field) loading cleanly.
    #[serde(default = "default_true")]
    include_worktrees: bool,
}

fn default_true() -> bool {
    true
}

impl Default for Store {
    fn default() -> Self {
        Self {
            roots: Vec::new(),
            order: Vec::new(),
            scripts_root: None,
            include_worktrees: true,
        }
    }
}

fn store_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::new(e.to_string()))?;
    Ok(dir.join("scan-roots.json"))
}

fn load_store(app: &AppHandle) -> Result<Store, AppError> {
    let path = store_path(app)?;
    if !path.exists() {
        return Ok(Store::default());
    }
    Ok(serde_json::from_slice(&std::fs::read(&path)?)?)
}

fn save_store(app: &AppHandle, store: &Store) -> Result<(), AppError> {
    let path = store_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, serde_json::to_vec_pretty(store)?)?;
    Ok(())
}

pub fn load_roots(app: &AppHandle) -> Result<Vec<String>, AppError> {
    Ok(load_store(app)?.roots)
}

pub fn save_roots(app: &AppHandle, roots: &[String]) -> Result<(), AppError> {
    let mut store = load_store(app)?;
    store.roots = roots.to_vec();
    save_store(app, &store)
}

pub fn load_order(app: &AppHandle) -> Result<Vec<String>, AppError> {
    Ok(load_store(app)?.order)
}

pub fn save_order(app: &AppHandle, order: &[String]) -> Result<(), AppError> {
    let mut store = load_store(app)?;
    store.order = order.to_vec();
    save_store(app, &store)
}

pub fn load_scripts_root(app: &AppHandle) -> Result<Option<String>, AppError> {
    Ok(load_store(app)?.scripts_root)
}

pub fn save_scripts_root(app: &AppHandle, path: Option<&str>) -> Result<(), AppError> {
    let mut store = load_store(app)?;
    store.scripts_root = path.map(str::to_string);
    save_store(app, &store)
}

pub fn load_include_worktrees(app: &AppHandle) -> Result<bool, AppError> {
    Ok(load_store(app)?.include_worktrees)
}

pub fn save_include_worktrees(app: &AppHandle, include: bool) -> Result<(), AppError> {
    let mut store = load_store(app)?;
    store.include_worktrees = include;
    save_store(app, &store)
}
