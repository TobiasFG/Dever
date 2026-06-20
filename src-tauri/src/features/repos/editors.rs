use crate::error::AppError;
use crate::features::repos::model::Editor;
use std::process::Command;

/// A code editor we know how to detect and launch. On macOS detection/launch
/// goes through the app bundle id; elsewhere through the CLI on `PATH`.
struct KnownEditor {
    id: &'static str,
    name: &'static str,
    /// macOS app bundle identifier (empty when the editor has no macOS build).
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
    bundle_id: &'static str,
    /// CLI launcher on `PATH` (empty when the editor ships no CLI).
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    cli: &'static str,
}

/// The curated set of editors we can open repos in. Visual Studio (`devenv`)
/// is Windows-only and Xcode is macOS-only; the per-OS detectors skip entries
/// that don't apply to the current platform.
const KNOWN: &[KnownEditor] = &[
    KnownEditor {
        id: "vscode",
        name: "VS Code",
        bundle_id: "com.microsoft.VSCode",
        cli: "code",
    },
    KnownEditor {
        id: "cursor",
        name: "Cursor",
        bundle_id: "com.todesktop.230313mzl4w4u92",
        cli: "cursor",
    },
    KnownEditor {
        id: "zed",
        name: "Zed",
        bundle_id: "dev.zed.Zed",
        cli: "zed",
    },
    KnownEditor {
        id: "sublime",
        name: "Sublime Text",
        bundle_id: "com.sublimetext.4",
        cli: "subl",
    },
    KnownEditor {
        id: "atom",
        name: "Atom",
        bundle_id: "com.github.atom",
        cli: "atom",
    },
    KnownEditor {
        id: "intellij",
        name: "IntelliJ IDEA",
        bundle_id: "com.jetbrains.intellij",
        cli: "idea",
    },
    KnownEditor {
        id: "xcode",
        name: "Xcode",
        bundle_id: "com.apple.dt.Xcode",
        cli: "",
    },
    KnownEditor {
        id: "visualstudio",
        name: "Visual Studio",
        bundle_id: "",
        cli: "devenv",
    },
];

fn find(id: &str) -> Option<&'static KnownEditor> {
    KNOWN.iter().find(|e| e.id == id)
}

/// Detect which known editors are installed on this machine.
pub fn list() -> Result<Vec<Editor>, AppError> {
    let installed = KNOWN
        .iter()
        .filter(|e| is_installed(e))
        .map(|e| Editor {
            id: e.id.to_string(),
            name: e.name.to_string(),
        })
        .collect();
    Ok(installed)
}

/// Open `path` in the editor with the given id.
pub fn open(path: &str, editor_id: &str) -> Result<(), AppError> {
    let editor =
        find(editor_id).ok_or_else(|| AppError::new(format!("unknown editor: {editor_id}")))?;
    launch(editor, path)
}

#[cfg(target_os = "macos")]
fn is_installed(editor: &KnownEditor) -> bool {
    if editor.bundle_id.is_empty() {
        return false;
    }
    Command::new("mdfind")
        .arg(format!(
            "kMDItemCFBundleIdentifier == '{}'",
            editor.bundle_id
        ))
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false)
}

#[cfg(not(target_os = "macos"))]
fn is_installed(editor: &KnownEditor) -> bool {
    if editor.cli.is_empty() {
        return false;
    }
    let finder = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    Command::new(finder)
        .arg(editor.cli)
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false)
}

#[cfg(target_os = "macos")]
fn launch(editor: &KnownEditor, path: &str) -> Result<(), AppError> {
    run(Command::new("open").args(["-b", editor.bundle_id, path]))
}

#[cfg(not(target_os = "macos"))]
fn launch(editor: &KnownEditor, path: &str) -> Result<(), AppError> {
    run(Command::new(editor.cli).arg(path))
}

/// Spawn a launcher and surface its failure (non-zero exit) as an `AppError`.
fn run(cmd: &mut Command) -> Result<(), AppError> {
    let output = cmd.output()?;
    if !output.status.success() {
        return Err(AppError::new(
            String::from_utf8_lossy(&output.stderr).trim().to_string(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn editor_ids_are_unique() {
        let ids: HashSet<_> = KNOWN.iter().map(|e| e.id).collect();
        assert_eq!(ids.len(), KNOWN.len());
    }

    #[test]
    fn find_resolves_known_and_rejects_unknown() {
        assert_eq!(find("vscode").map(|e| e.name), Some("VS Code"));
        assert!(find("notepad").is_none());
    }
}
