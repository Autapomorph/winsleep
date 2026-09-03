use super::get_app_state_path;
use std::fs;

#[tauri::command]
pub fn load_app_state(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = get_app_state_path(&app_handle)?;

    if !path.exists() {
        return Ok(serde_json::Value::Null);
    }

    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read state file: {e}"))?;
    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse state JSON: {e}"))?;

    Ok(json)
}

#[tauri::command]
pub fn save_app_state(
    app_handle: tauri::AppHandle,
    state: serde_json::Value,
) -> Result<(), String> {
    let path = get_app_state_path(&app_handle)?;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {e}"))?;
        }
    }

    let json_str = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Failed to serialize state: {e}"))?;

    fs::write(&path, json_str).map_err(|e| format!("Failed to write state file: {e}"))?;

    Ok(())
}
