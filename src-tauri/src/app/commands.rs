use tauri::Manager;

#[tauri::command]
pub fn quit_app(app_handle: tauri::AppHandle) {
    if let Some(keep_awake) = app_handle.try_state::<crate::pc_management::KeepAwakeManager>() {
        let _ = keep_awake.release();
    }
    
    app_handle.exit(0);
}

#[tauri::command]
pub fn set_is_critical_operation_in_progress(is_in_progress: bool) {
    crate::app::window::set_critical_operation_in_progress(is_in_progress);
}

