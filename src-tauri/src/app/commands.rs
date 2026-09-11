use tauri::Manager;

#[tauri::command]
pub fn quit_app(app_handle: tauri::AppHandle) {
    if let Some(keep_awake) = app_handle.try_state::<crate::pc_management::KeepAwakeManager>() {
        let _ = keep_awake.release();
    }
    
    app_handle.exit(0);
}

