mod config;
mod error;
mod features;

use features::repos::commands::{add_scan_root, list_scan_roots, remove_scan_root, scan_repos};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_scan_roots,
            add_scan_root,
            remove_scan_root,
            scan_repos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
