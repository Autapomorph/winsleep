use std::path::PathBuf;

pub mod commands;

pub fn get_app_state_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    crate::paths::get_app_state_path(app_handle)
}
