use crate::pc_management;
use crate::settings::AppSettings;
use tauri::{Emitter, Listener, Manager};

pub fn setup_window(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let window = app_handle.get_webview_window("main").unwrap();

    pc_management::setup_power_events(&window);

    // Check if launched with --autostart and if minimized boot setting is enabled
    let is_autostart_arg = std::env::args().any(|arg| arg == "--autostart");
    let is_start_minimized = AppSettings::load_initial_start_minimized(app_handle);
    let should_hide = is_autostart_arg && is_start_minimized;

    // Listen for ready event from frontend
    // Hide the window initially and only show it once the frontend is ready
    // This prevents a blank window from showing during load
    let window_clone = window.clone();
    window.listen("app-ready", move |_| {
        if !should_hide {
            window_clone.show().unwrap();
        }
    });

    Ok(())
}

pub fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "main" {
            let app_handle = window.app_handle();
            let settings = app_handle.state::<AppSettings>();

            if settings
                .is_tray_mode_enabled
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                api.prevent_close();
                window.hide().unwrap();
                let _ = window.emit("window-closed-to-tray", ());
            } else {
                app_handle.exit(0);
            }
        }
    }
}
