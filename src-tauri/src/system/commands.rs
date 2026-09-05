#[tauri::command]
pub fn is_portable() -> bool {
    super::is_portable()
}
