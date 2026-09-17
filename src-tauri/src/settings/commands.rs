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

    let json_str = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;

    let bytes = json_str.as_bytes();
    let content_hash = AppSettings::calculate_hash(bytes);

    // Update the last known content hash BEFORE writing to disk.
    // This ensures that when atomic_write replaces the file and notify triggers,
    // the watcher callback immediately observes the matching hash without race conditions.
    if let Ok(mut guard) = state.last_content_hash.lock() {
        *guard = Some(content_hash);
    }

    if let Err(e) = crate::paths::atomic_write(&path, bytes) {
        // Revert last_content_hash to the actual file content on disk if write failed
        let disk_hash = std::fs::read(&path)
            .ok()
            .map(|b| AppSettings::calculate_hash(&b));
        if let Ok(mut guard) = state.last_content_hash.lock() {
            *guard = disk_hash;
        }
        return Err(format!("Failed to write settings file: {e}"));
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
