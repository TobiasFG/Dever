//! Key-preserving read/write over Claude Code's JSON config files.
//!
//! `~/.claude.json` and `~/.claude/settings.json` hold many keys we don't own.
//! We load the whole file as a `serde_json::Value` object, let callers mutate
//! only the key they manage, and write it back — never reserializing from a
//! typed struct (which would silently drop the user's other settings).

use crate::error::AppError;
use serde_json::{Map, Value};
use std::path::Path;

/// Load a JSON object file, returning an empty object when the file is absent.
pub fn load_object(path: &Path) -> Result<Map<String, Value>, AppError> {
    if !path.exists() {
        return Ok(Map::new());
    }
    match serde_json::from_slice(&std::fs::read(path)?)? {
        Value::Object(map) => Ok(map),
        _ => Err(AppError::new(format!(
            "{} is not a JSON object",
            path.display()
        ))),
    }
}

/// Write a JSON object back, creating parent directories as needed.
pub fn save_object(path: &Path, map: &Map<String, Value>) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(
        path,
        serde_json::to_vec_pretty(&Value::Object(map.clone()))?,
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn mutating_one_key_preserves_siblings() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("settings.json");
        let original = json!({
            "model": "claude-opus",
            "hooks": { "Stop": [] },
            "enabledPlugins": {}
        });
        std::fs::write(&path, serde_json::to_vec_pretty(&original).unwrap()).unwrap();

        let mut map = load_object(&path).unwrap();
        map.insert("enabledPlugins".into(), json!({ "a@m": true }));
        save_object(&path, &map).unwrap();

        let after = load_object(&path).unwrap();
        assert_eq!(after.get("model").unwrap(), "claude-opus");
        assert_eq!(after.get("hooks").unwrap(), &json!({ "Stop": [] }));
        assert_eq!(
            after.get("enabledPlugins").unwrap(),
            &json!({ "a@m": true })
        );
    }

    #[test]
    fn missing_file_loads_as_empty_object() {
        let tmp = tempfile::tempdir().unwrap();
        let map = load_object(&tmp.path().join("nope.json")).unwrap();
        assert!(map.is_empty());
    }
}
