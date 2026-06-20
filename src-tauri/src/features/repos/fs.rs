use crate::error::AppError;
use std::process::Command;

/// Reveal `path` in the system file manager (Finder / Explorer / the desktop's
/// default handler).
pub fn reveal(path: &str) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    let mut cmd = {
        let mut c = Command::new("open");
        c.arg(path);
        c
    };
    #[cfg(target_os = "linux")]
    let mut cmd = {
        let mut c = Command::new("xdg-open");
        c.arg(path);
        c
    };
    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut c = Command::new("explorer");
        c.arg(path);
        c
    };

    cmd.spawn()?;
    Ok(())
}
