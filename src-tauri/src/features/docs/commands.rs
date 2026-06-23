use crate::error::AppError;
use crate::features::docs::{
    model::{DocFile, DocNode},
    scan,
};
use std::path::Path;
use std::time::UNIX_EPOCH;

/// List a repo's markdown documentation as a depth-annotated, tree-ordered
/// flat list for the docs sidebar.
#[tauri::command]
pub fn list_docs(path: String) -> Result<Vec<DocNode>, AppError> {
    Ok(scan::collect(Path::new(&path)))
}

/// Read one documentation file's raw markdown. `rel` is repo-relative; the
/// resolved path is verified to stay inside the repo so a crafted `..` can't
/// read arbitrary files.
#[tauri::command]
pub fn read_doc(path: String, rel: String) -> Result<DocFile, AppError> {
    let repo = Path::new(&path)
        .canonicalize()
        .map_err(|e| AppError::new(format!("repo not found: {e}")))?;
    let target = repo.join(&rel);
    let target = target
        .canonicalize()
        .map_err(|e| AppError::new(format!("doc not found: {e}")))?;
    if !target.starts_with(&repo) {
        return Err(AppError::new("doc path escapes the repository"));
    }

    let content = std::fs::read_to_string(&target)?;
    let modified = target
        .metadata()
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    Ok(DocFile {
        path: rel.replace('\\', "/"),
        content,
        modified,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn read_doc_rejects_path_escape() {
        let tmp = tempfile::tempdir().unwrap();
        let repo = tmp.path();
        fs::write(repo.join("README.md"), "# hi").unwrap();
        // A secret one level up, outside the repo.
        fs::write(tmp.path().parent().unwrap().join("secret.md"), "nope").ok();

        let res = read_doc(
            repo.to_string_lossy().to_string(),
            "../secret.md".to_string(),
        );
        assert!(res.is_err());
    }

    #[test]
    fn read_doc_returns_contents_for_in_repo_file() {
        let tmp = tempfile::tempdir().unwrap();
        let repo = tmp.path();
        fs::write(repo.join("README.md"), "# hello").unwrap();

        let doc = read_doc(repo.to_string_lossy().to_string(), "README.md".to_string()).unwrap();
        assert_eq!(doc.content, "# hello");
        assert_eq!(doc.path, "README.md");
    }
}
