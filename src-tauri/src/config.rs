use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Persisted settings, stored as JSON under the app config dir.
#[derive(Default, Serialize, Deserialize)]
struct Store {
    roots: Vec<String>,
    /// User-defined repo ordering for the dashboard, as a list of repo paths.
    /// Repos not listed here fall back to alphabetical order. `default` keeps
    /// older config files (which only had `roots`) loading cleanly.
    #[serde(default)]
    order: Vec<String>,
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
