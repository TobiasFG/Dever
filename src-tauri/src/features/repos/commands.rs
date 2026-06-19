use crate::config;
use crate::error::AppError;
use crate::features::repos::{git, model::Repo, scan};
use std::path::{Path, PathBuf};
use std::thread;
use tauri::AppHandle;

#[tauri::command]
pub fn list_scan_roots(app: AppHandle) -> Result<Vec<String>, AppError> {
    config::load_roots(&app)
}

#[tauri::command]
pub fn add_scan_root(app: AppHandle, path: String) -> Result<Vec<String>, AppError> {
    let mut roots = config::load_roots(&app)?;
    if !roots.contains(&path) {
        roots.push(path);
    }
    config::save_roots(&app, &roots)?;
    Ok(roots)
}

#[tauri::command]
pub fn remove_scan_root(app: AppHandle, path: String) -> Result<Vec<String>, AppError> {
    let mut roots = config::load_roots(&app)?;
    roots.retain(|r| r != &path);
    config::save_roots(&app, &roots)?;
    Ok(roots)
}

/// Discover every repo under the configured roots and read each one's status
/// concurrently. Repos whose status can't be read are skipped.
#[tauri::command]
pub fn scan_repos(app: AppHandle) -> Result<Vec<Repo>, AppError> {
    let roots = config::load_roots(&app)?;

    let mut paths: Vec<PathBuf> = roots
        .iter()
        .flat_map(|root| scan::discover(Path::new(root)))
        .collect();
    paths.sort();
    paths.dedup();

    let mut repos: Vec<Repo> = thread::scope(|s| {
        let handles: Vec<_> = paths.iter().map(|p| s.spawn(|| build_repo(p))).collect();
        handles
            .into_iter()
            .filter_map(|h| h.join().ok().flatten())
            .collect()
    });
    repos.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(repos)
}

fn build_repo(path: &Path) -> Option<Repo> {
    let status = git::status(path).ok()?;
    Some(Repo {
        name: path.file_name()?.to_string_lossy().to_string(),
        path: path.to_string_lossy().to_string(),
        branch: status.branch,
        upstream: status.upstream,
        ahead: status.ahead,
        behind: status.behind,
        changes: status.changes,
        conflict: status.conflict,
        detached: status.detached,
    })
}
