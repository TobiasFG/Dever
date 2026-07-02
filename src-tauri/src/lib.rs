mod config;
mod error;
mod features;

use features::claude::commands::{
    ask_claude, claude_status, read_global_claude_md, repo_claude, set_mcp_enabled,
    set_plugin_enabled, set_repo_mcp_enabled, set_repo_plugin_enabled, write_global_claude_md,
};
use features::docs::commands::{list_docs, read_doc};
use features::repos::commands::{
    add_scan_root, list_branches, list_editors, list_scan_roots, open_in_editor, open_terminal,
    pull_repo, remove_scan_root, reveal_in_file_manager, scan_repos, set_repo_order, switch_branch,
};

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
            scan_repos,
            set_repo_order,
            pull_repo,
            list_branches,
            switch_branch,
            list_editors,
            open_in_editor,
            open_terminal,
            reveal_in_file_manager,
            claude_status,
            read_global_claude_md,
            write_global_claude_md,
            set_mcp_enabled,
            set_plugin_enabled,
            repo_claude,
            set_repo_mcp_enabled,
            set_repo_plugin_enabled,
            ask_claude,
            list_docs,
            read_doc
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
