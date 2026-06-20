use crate::error::AppError;
use std::process::Command;

/// Open a new terminal session at `path` in the system's default terminal.
#[cfg(target_os = "macos")]
pub fn open(path: &str) -> Result<(), AppError> {
    spawn(Command::new("open").args(["-a", "Terminal", path]))
}

/// Try the common Linux terminal launchers in order until one is present.
#[cfg(target_os = "linux")]
pub fn open(path: &str) -> Result<(), AppError> {
    let candidates: [(&str, &[&str]); 3] = [
        ("x-terminal-emulator", &["--working-directory"]),
        ("gnome-terminal", &["--working-directory"]),
        ("konsole", &["--workdir"]),
    ];
    for (bin, flags) in candidates {
        let mut cmd = Command::new(bin);
        cmd.args(flags).arg(path);
        if cmd.spawn().is_ok() {
            return Ok(());
        }
    }
    Err(AppError::new("no supported terminal emulator found"))
}

#[cfg(target_os = "windows")]
pub fn open(path: &str) -> Result<(), AppError> {
    if Command::new("wt").args(["-d", path]).spawn().is_ok() {
        return Ok(());
    }
    spawn(Command::new("cmd").args(["/c", "start", "cmd", "/k", "cd", "/d", path]))
}

/// Spawn a launcher and surface a failure to start as an `AppError`.
#[cfg(any(target_os = "macos", target_os = "windows"))]
fn spawn(cmd: &mut Command) -> Result<(), AppError> {
    cmd.spawn()?;
    Ok(())
}
