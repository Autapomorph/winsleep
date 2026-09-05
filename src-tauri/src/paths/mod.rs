use std::path::PathBuf;
use tauri::Manager;

/// Returns the directory containing the currently running executable.
pub fn get_exe_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {e}"))?;

    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "Failed to get executable parent directory".to_string())?;

    Ok(exe_dir.to_path_buf())
}

/// Returns the root configuration directory.
/// In portable mode, this is the directory containing the executable.
/// In installed mode, this is the standard Tauri `app_config_dir`.
pub fn get_config_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    if crate::system::is_portable() {
        return get_exe_dir();
    }

    app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory path: {e}"))
}

/// Returns the path to `settings.json`.
pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_config_dir(app_handle)?;
    path.push("settings.json");
    Ok(path)
}

/// Returns the path to `state.json`.
pub fn get_app_state_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_config_dir(app_handle)?;
    path.push("state.json");
    Ok(path)
}

/// Returns the directory where log files should be stored.
/// In portable mode, this is `<exe_dir>/logs`.
/// In installed mode, this is the standard Tauri `app_log_dir`.
pub fn get_log_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    if crate::system::is_portable() {
        let mut path = get_exe_dir()?;
        path.push("logs");
        return Ok(path);
    }

    app_handle
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory path: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_exe_dir() {
        let exe_dir = get_exe_dir();
        assert!(exe_dir.is_ok());
    }
}
