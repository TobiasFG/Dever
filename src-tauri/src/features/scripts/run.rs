use crate::error::AppError;
use crate::features::scripts::model::{ScriptKind, ScriptResult};
use crate::features::scripts::scan;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Instant;

/// Run a script to completion in `cwd`, capturing its output. A non-zero exit
/// is returned as a valid `ScriptResult` (`success: false`); `Err` is reserved
/// for failures to launch the process at all.
pub fn run(script: &Path, cwd: &Path) -> Result<ScriptResult, AppError> {
    if !script.is_file() {
        return Err(AppError::new("This script no longer exists on disk."));
    }
    let name = script.file_name().and_then(|n| n.to_str()).unwrap_or("");
    let kind = scan::kind_for(name).ok_or_else(|| AppError::new("Unrecognized script type."))?;

    let mut cmd = command_for(kind, script)?;
    cmd.current_dir(cwd);

    let started = Instant::now();
    let output = cmd
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| AppError::new(format!("Couldn't start the script: {e}")))?;
    let duration_ms = started.elapsed().as_millis() as u64;

    Ok(ScriptResult {
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        duration_ms,
        success: output.status.success(),
    })
}

/// Build the interpreter invocation for a script. The interpreter is resolved
/// on `PATH`; on Windows a resolved `.cmd`/`.bat` shim (common for `node`) is
/// routed through `cmd /C`, which `CreateProcess` requires. Batch scripts
/// themselves are launched through `cmd /C` directly.
fn command_for(kind: ScriptKind, script: &Path) -> Result<Command, AppError> {
    if kind == ScriptKind::Batch {
        if !cfg!(target_os = "windows") {
            return Err(AppError::new(".bat/.cmd scripts can only run on Windows."));
        }
        let mut c = Command::new("cmd");
        c.arg("/C").arg(script);
        return Ok(c);
    }

    let candidates: &[&str] = match kind {
        ScriptKind::PowerShell => &["pwsh", "powershell"],
        ScriptKind::Shell => &["bash", "sh"],
        ScriptKind::Python => &["python3", "python"],
        ScriptKind::Node => &["node"],
        ScriptKind::Batch => unreachable!("handled above"),
    };
    let bin = resolve_binary(candidates)?;

    let mut args: Vec<String> = Vec::new();
    if kind == ScriptKind::PowerShell {
        args.push("-NoProfile".into());
        args.push("-File".into());
    }
    args.push(script.to_string_lossy().to_string());

    let lower = bin.to_ascii_lowercase();
    let cmd = if cfg!(target_os = "windows") && (lower.ends_with(".cmd") || lower.ends_with(".bat"))
    {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&bin).args(&args);
        c
    } else {
        let mut c = Command::new(&bin);
        c.args(&args);
        c
    };
    Ok(cmd)
}

/// Locate the first available interpreter from `candidates` on `PATH`, the same
/// way the Claude feature resolves its binary, returning the full path so a
/// `.cmd` shim can be told apart from a native executable.
fn resolve_binary(candidates: &[&str]) -> Result<String, AppError> {
    let finder = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    for cand in candidates {
        if let Ok(out) = Command::new(finder).arg(cand).output() {
            if out.status.success() {
                let path = String::from_utf8_lossy(&out.stdout)
                    .lines()
                    .next()
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !path.is_empty() {
                    return Ok(path);
                }
            }
        }
    }
    Err(AppError::new(format!(
        "Couldn't find an interpreter on your PATH (tried: {}).",
        candidates.join(", ")
    )))
}
