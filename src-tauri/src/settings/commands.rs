use super::AppSettings;
use std::fs;
use std::sync::atomic::Ordering;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn load_settings(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = AppSettings::get_settings_path(&app_handle)?;

    if !path.exists() {
        return Ok(serde_json::Value::Null);
    }

    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read settings file: {e}"))?;
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings JSON: {e}"))?;

    Ok(json)
}

#[tauri::command]
pub fn save_settings(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppSettings>,
    settings: serde_json::Value,
) -> Result<(), String> {
    let path = AppSettings::get_settings_path(&app_handle)?;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {e}"))?;
        }
    }

    let json_str = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;

    fs::write(&path, json_str).map_err(|e| format!("Failed to write settings file: {e}"))?;

    // Update the last write time for the file watcher to ignore this write event
    if let Ok(metadata) = fs::metadata(&path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(mut guard) = state.last_write_time.lock() {
                *guard = Some(modified);
            }
        }
    }

    // Update the in-memory tray mode state if it is present in the settings object
    if let Some(is_enabled) = settings.get("isTrayModeEnabled").and_then(|v| v.as_bool()) {
        state
            .is_tray_mode_enabled
            .store(is_enabled, Ordering::Relaxed);
    }

    Ok(())
}

#[tauri::command]
pub fn open_settings_dir(app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = AppSettings::get_settings_path(&app_handle)?;
    let parent = path.parent().ok_or("Failed to get config directory path")?;

    if !parent.exists() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {e}"))?;
    }

    app_handle
        .opener()
        .open_path(parent.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| format!("Failed to open config directory: {e}"))?;

    Ok(())
}
