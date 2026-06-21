use crate::error::AppError;
use crate::features::claude::model::SystemPrompt;
use crate::features::claude::paths;
use tauri::AppHandle;

/// Number of lines in the file (0 for empty content).
pub fn line_count(content: &str) -> u32 {
    if content.is_empty() {
        0
    } else {
        content.lines().count() as u32
    }
}

/// Metadata about the global CLAUDE.md for the dashboard card.
pub fn info(app: &AppHandle) -> Result<SystemPrompt, AppError> {
    let path = paths::claude_md(app)?;
    let exists = path.exists();
    let lines = if exists {
        line_count(&std::fs::read_to_string(&path)?)
    } else {
        0
    };
    Ok(SystemPrompt {
        exists,
        path: "~/.claude/CLAUDE.md".to_string(),
        lines,
    })
}

/// Read the global CLAUDE.md, returning empty string when it doesn't exist.
pub fn read(app: &AppHandle) -> Result<String, AppError> {
    let path = paths::claude_md(app)?;
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(std::fs::read_to_string(path)?)
}

/// Write the global CLAUDE.md, creating `~/.claude/` and the file if missing.
pub fn write(app: &AppHandle, content: &str) -> Result<(), AppError> {
    let path = paths::claude_md(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, content)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_lines() {
        assert_eq!(line_count(""), 0);
        assert_eq!(line_count("one"), 1);
        assert_eq!(line_count("one\ntwo\nthree"), 3);
        assert_eq!(line_count("trailing\n"), 1);
    }
}
