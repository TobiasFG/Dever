use crate::config;
use crate::error::AppError;
use crate::features::repos::{
    branches, editors, fs, git,
    model::{Branch, Editor, Repo},
    scan, terminal,
};
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

    let order = config::load_order(&app)?;
    sort_repos(&mut repos, &order);
    Ok(repos)
}

/// Order repos by the user's saved arrangement: repos listed in `order` come
/// first in that order, and anything not listed (newly discovered) follows
/// alphabetically by name.
fn sort_repos(repos: &mut [Repo], order: &[String]) {
    let rank = |path: &str| order.iter().position(|p| p == path);
    repos.sort_by(|a, b| match (rank(&a.path), rank(&b.path)) {
        (Some(ia), Some(ib)) => ia.cmp(&ib),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
}

/// Persist the user's repo ordering (a list of repo paths) for the dashboard.
#[tauri::command]
pub fn set_repo_order(app: AppHandle, order: Vec<String>) -> Result<(), AppError> {
    config::save_order(&app, &order)
}

/// Fast-forward-only pull for one repo, returning its refreshed status. Fails
/// (without changing the repo) when the pull isn't a clean fast-forward.
#[tauri::command]
pub fn pull_repo(path: String) -> Result<Repo, AppError> {
    let repo_path = Path::new(&path);
    git::pull(repo_path)?;
    build_repo(repo_path).ok_or_else(|| AppError::new(format!("repo vanished after pull: {path}")))
}

/// List a repo's local + remote branches for the switch-branch combobox.
#[tauri::command]
pub fn list_branches(path: String) -> Result<Vec<Branch>, AppError> {
    branches::list(Path::new(&path))
}

/// Switch a repo to the given branch (creating a local tracking branch when the
/// target is remote-only).
#[tauri::command]
pub fn switch_branch(path: String, name: String, is_remote: bool) -> Result<(), AppError> {
    branches::switch(Path::new(&path), &name, is_remote)
}

/// The code editors detected on this machine.
#[tauri::command]
pub fn list_editors() -> Result<Vec<Editor>, AppError> {
    editors::list()
}

/// Open a repo in the chosen editor.
#[tauri::command]
pub fn open_in_editor(path: String, editor_id: String) -> Result<(), AppError> {
    editors::open(&path, &editor_id)
}

/// Open a terminal session at the repo root.
#[tauri::command]
pub fn open_terminal(path: String) -> Result<(), AppError> {
    terminal::open(&path)
}

/// Reveal the repo folder in the system file manager.
#[tauri::command]
pub fn reveal_in_file_manager(path: String) -> Result<(), AppError> {
    fs::reveal(&path)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn repo(name: &str, path: &str) -> Repo {
        Repo {
            name: name.to_string(),
            path: path.to_string(),
            branch: None,
            upstream: None,
            ahead: 0,
            behind: 0,
            changes: 0,
            conflict: false,
            detached: false,
        }
    }

    #[test]
    fn ordered_repos_lead_then_unlisted_go_alphabetical() {
        let mut repos = vec![repo("zebra", "/z"), repo("alpha", "/a"), repo("beta", "/b")];
        // User pinned /b then /z; /a is unlisted.
        sort_repos(&mut repos, &["/b".to_string(), "/z".to_string()]);
        let paths: Vec<_> = repos.iter().map(|r| r.path.as_str()).collect();
        assert_eq!(paths, vec!["/b", "/z", "/a"]);
    }

    #[test]
    fn empty_order_is_alphabetical_by_name() {
        let mut repos = vec![repo("zebra", "/z"), repo("Alpha", "/a")];
        sort_repos(&mut repos, &[]);
        let names: Vec<_> = repos.iter().map(|r| r.name.as_str()).collect();
        assert_eq!(names, vec!["Alpha", "zebra"]);
    }
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
