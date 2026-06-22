use crate::error::AppError;
use crate::features::repos::model::Editor;
use std::process::Command;

/// A code editor we know how to detect and launch. Detection/launch is
/// per-platform: macOS goes through the app bundle id, Windows through a known
/// install path (or `vswhere` for Visual Studio) falling back to the CLI on
/// `PATH`, and Linux through the CLI on `PATH`.
struct KnownEditor {
    id: &'static str,
    name: &'static str,
    /// macOS app bundle identifier (empty when the editor has no macOS build).
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
    bundle_id: &'static str,
    /// CLI launcher on `PATH` (empty when the editor ships no CLI). Used on
    /// Linux, and on Windows as the fallback when no known path matches.
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    cli: &'static str,
    /// Candidate absolute executable paths on Windows, as templates with
    /// `%VAR%` environment placeholders. The first one that exists wins. Empty
    /// when we rely solely on the CLI (or a dedicated locator like `vswhere`).
    #[cfg_attr(not(target_os = "windows"), allow(dead_code))]
    win_paths: &'static [&'static str],
}

/// The curated set of editors we can open repos in. Visual Studio is
/// Windows-only and Xcode is macOS-only; the per-OS detectors skip entries that
/// don't apply to the current platform.
const KNOWN: &[KnownEditor] = &[
    KnownEditor {
        id: "vscode",
        name: "VS Code",
        bundle_id: "com.microsoft.VSCode",
        cli: "code",
        win_paths: &[
            r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe",
            r"%PROGRAMFILES%\Microsoft VS Code\Code.exe",
            r"%PROGRAMFILES(X86)%\Microsoft VS Code\Code.exe",
        ],
    },
    KnownEditor {
        id: "cursor",
        name: "Cursor",
        bundle_id: "com.todesktop.230313mzl4w4u92",
        cli: "cursor",
        win_paths: &[
            r"%LOCALAPPDATA%\Programs\cursor\Cursor.exe",
            r"%PROGRAMFILES%\cursor\Cursor.exe",
        ],
    },
    KnownEditor {
        id: "zed",
        name: "Zed",
        bundle_id: "dev.zed.Zed",
        cli: "zed",
        win_paths: &[
            r"%LOCALAPPDATA%\Programs\Zed\Zed.exe",
            r"%LOCALAPPDATA%\Zed\Zed.exe",
        ],
    },
    KnownEditor {
        id: "sublime",
        name: "Sublime Text",
        bundle_id: "com.sublimetext.4",
        cli: "subl",
        win_paths: &[
            r"%PROGRAMFILES%\Sublime Text\sublime_text.exe",
            r"%PROGRAMFILES%\Sublime Text 3\sublime_text.exe",
        ],
    },
    KnownEditor {
        id: "atom",
        name: "Atom",
        bundle_id: "com.github.atom",
        cli: "atom",
        win_paths: &[r"%LOCALAPPDATA%\atom\atom.exe"],
    },
    KnownEditor {
        id: "intellij",
        name: "IntelliJ IDEA",
        bundle_id: "com.jetbrains.intellij",
        cli: "idea",
        win_paths: &[],
    },
    KnownEditor {
        id: "xcode",
        name: "Xcode",
        bundle_id: "com.apple.dt.Xcode",
        cli: "",
        win_paths: &[],
    },
    KnownEditor {
        id: "visualstudio",
        name: "Visual Studio",
        bundle_id: "",
        cli: "devenv",
        win_paths: &[],
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

// ---------------------------------------------------------------------------
// macOS: detect and launch through the app bundle id.
// ---------------------------------------------------------------------------

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

#[cfg(target_os = "macos")]
fn launch(editor: &KnownEditor, path: &str) -> Result<(), AppError> {
    run(Command::new("open").args(["-b", editor.bundle_id, path]))
}

// ---------------------------------------------------------------------------
// Windows: resolve a real executable from a known install path (or `vswhere`),
// falling back to the CLI on `PATH`, then launch it directly. We must not just
// `Command::new("code")`: the VS Code launcher on `PATH` is `code.cmd`, a batch
// shim that Rust's process spawner can't execute directly — so opening a repo
// silently failed. Resolving `Code.exe` (or routing a shim through `cmd`) fixes
// both "can't open on Windows" and "only VS Code is detected".
// ---------------------------------------------------------------------------

#[cfg(target_os = "windows")]
fn is_installed(editor: &KnownEditor) -> bool {
    resolve_windows(editor).is_some()
}

#[cfg(target_os = "windows")]
fn launch(editor: &KnownEditor, path: &str) -> Result<(), AppError> {
    let target = resolve_windows(editor)
        .ok_or_else(|| AppError::new(format!("{} is not installed", editor.name)))?;

    let is_exe = target
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("exe"))
        .unwrap_or(false);

    if is_exe {
        // A real GUI executable — spawn it directly and don't wait for it.
        spawn(Command::new(&target).arg(path))
    } else {
        // A `.cmd`/`.bat` shim (e.g. from `where code`) — run it through
        // cmd.exe with the documented `cmd /C ""prog" "arg""` quoting so paths
        // with spaces survive.
        use std::os::windows::process::CommandExt;
        let line = format!("/C \"\"{}\" \"{}\"\"", target.display(), path);
        let mut cmd = Command::new("cmd");
        cmd.raw_arg(line);
        spawn(&mut cmd)
    }
}

/// Resolve the executable to launch for an editor on Windows: Visual Studio via
/// `vswhere`, otherwise the first known install path that exists, otherwise the
/// CLI located on `PATH`.
#[cfg(target_os = "windows")]
fn resolve_windows(editor: &KnownEditor) -> Option<std::path::PathBuf> {
    use std::path::PathBuf;

    if editor.id == "visualstudio" {
        if let Some(devenv) = vswhere_devenv() {
            return Some(devenv);
        }
    }

    for tmpl in editor.win_paths {
        if let Some(expanded) = expand_env(tmpl) {
            let p = PathBuf::from(expanded);
            if p.exists() {
                return Some(p);
            }
        }
    }

    which_windows(editor.cli)
}

/// Locate `devenv.exe` for the latest Visual Studio install via `vswhere`,
/// which ships at a fixed path with the VS Installer.
#[cfg(target_os = "windows")]
fn vswhere_devenv() -> Option<std::path::PathBuf> {
    use std::path::PathBuf;
    let vswhere = expand_env(r"%PROGRAMFILES(X86)%\Microsoft Visual Studio\Installer\vswhere.exe")?;
    if !PathBuf::from(&vswhere).exists() {
        return None;
    }
    let out = Command::new(&vswhere)
        .args(["-latest", "-property", "productPath"])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let p = PathBuf::from(path);
    if p.exists() {
        Some(p)
    } else {
        None
    }
}

/// Find `cli` on `PATH` via `where`, returning the first match as a path.
#[cfg(target_os = "windows")]
fn which_windows(cli: &str) -> Option<std::path::PathBuf> {
    use std::path::PathBuf;
    if cli.is_empty() {
        return None;
    }
    let out = Command::new("where").arg(cli).output().ok()?;
    if !out.status.success() {
        return None;
    }
    let first = String::from_utf8_lossy(&out.stdout)
        .lines()
        .next()?
        .trim()
        .to_string();
    if first.is_empty() {
        None
    } else {
        Some(PathBuf::from(first))
    }
}

/// Expand `%VAR%` placeholders in a Windows path template. Returns `None` if any
/// referenced environment variable is unset.
#[cfg(target_os = "windows")]
fn expand_env(template: &str) -> Option<String> {
    let mut out = String::with_capacity(template.len());
    let mut rest = template;
    while let Some(start) = rest.find('%') {
        out.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        let end = after.find('%')?;
        let var = &after[..end];
        out.push_str(&std::env::var(var).ok()?);
        rest = &after[end + 1..];
    }
    out.push_str(rest);
    Some(out)
}

#[cfg(target_os = "windows")]
fn spawn(cmd: &mut Command) -> Result<(), AppError> {
    cmd.spawn()
        .map(|_| ())
        .map_err(|e| AppError::new(e.to_string()))
}

// ---------------------------------------------------------------------------
// Linux (and other unix): detect and launch through the CLI on `PATH`.
// ---------------------------------------------------------------------------

#[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
fn is_installed(editor: &KnownEditor) -> bool {
    if editor.cli.is_empty() {
        return false;
    }
    Command::new("which")
        .arg(editor.cli)
        .output()
        .map(|o| o.status.success() && !o.stdout.is_empty())
        .unwrap_or(false)
}

#[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
fn launch(editor: &KnownEditor, path: &str) -> Result<(), AppError> {
    run(Command::new(editor.cli).arg(path))
}

/// Spawn a launcher and surface its failure (non-zero exit) as an `AppError`.
#[cfg(not(target_os = "windows"))]
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

#[cfg(all(test, target_os = "windows"))]
mod win_tests {
    use super::*;

    #[test]
    fn expands_known_var() {
        std::env::set_var("DEVER_TEST_DIR", r"C:\foo");
        assert_eq!(
            expand_env(r"%DEVER_TEST_DIR%\Code.exe").as_deref(),
            Some(r"C:\foo\Code.exe")
        );
    }

    #[test]
    fn expands_template_with_no_vars() {
        assert_eq!(
            expand_env(r"C:\plain\path.exe").as_deref(),
            Some(r"C:\plain\path.exe")
        );
    }

    #[test]
    fn missing_var_is_none() {
        assert!(expand_env(r"%DEVER_DEFINITELY_UNSET_VAR%\x.exe").is_none());
    }
}
