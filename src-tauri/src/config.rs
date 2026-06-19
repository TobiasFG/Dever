use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Persisted settings, stored as JSON under the app config dir.
#[derive(Default, Serialize, Deserialize)]
struct Store {
    roots: Vec<String>,
}

fn store_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::new(e.to_string()))?;
    Ok(dir.join("scan-roots.json"))
}

pub fn load_roots(app: &AppHandle) -> Result<Vec<String>, AppError> {
    let path = store_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let store: Store = serde_json::from_slice(&std::fs::read(&path)?)?;
    Ok(store.roots)
}

pub fn save_roots(app: &AppHandle, roots: &[String]) -> Result<(), AppError> {
    let path = store_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let store = Store {
        roots: roots.to_vec(),
    };
    std::fs::write(&path, serde_json::to_vec_pretty(&store)?)?;
    Ok(())
}
