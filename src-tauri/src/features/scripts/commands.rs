use crate::config;
use crate::error::AppError;
use crate::features::scripts::{
    model::{Script, ScriptResult, ScriptScope},
    run, scan,
};
use std::path::Path;
use tauri::AppHandle;

/// Discover the runnable scripts under a repository's conventional script folders.
#[tauri::command]
pub fn list_repo_scripts(path: String) -> Result<Vec<Script>, AppError> {
    Ok(scan::discover(Path::new(&path), ScriptScope::Repo))
}

/// Discover the runnable scripts under the configured global scripts folder.
/// Returns an empty list when no global folder has been picked.
#[tauri::command]
pub fn list_global_scripts(app: AppHandle) -> Result<Vec<Script>, AppError> {
    match config::load_scripts_root(&app)? {
        Some(root) => Ok(scan::discover(Path::new(&root), ScriptScope::Global)),
        None => Ok(Vec::new()),
    }
}

/// The configured global scripts folder, if the user has picked one.
#[tauri::command]
pub fn get_scripts_root(app: AppHandle) -> Result<Option<String>, AppError> {
    config::load_scripts_root(&app)
}

/// Set (or clear, with `null`) the global scripts folder.
#[tauri::command]
pub fn set_scripts_root(app: AppHandle, path: Option<String>) -> Result<(), AppError> {
    config::save_scripts_root(&app, path.as_deref())
}

/// Run a script to completion in `cwd`, capturing its output.
#[tauri::command]
pub fn run_script(path: String, cwd: String) -> Result<ScriptResult, AppError> {
    run::run(Path::new(&path), Path::new(&cwd))
}
