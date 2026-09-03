use std::path::PathBuf;
use tauri::Manager;

pub mod commands;

pub fn get_app_state_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory path: {e}"))?;

    path.push("state.json");

    Ok(path)
}
