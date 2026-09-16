use crate::pc_management;
use crate::settings::AppSettings;
use tauri::{Emitter, Listener, Manager};

pub fn setup_window(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or("Failed to get main webview window")?;

    pc_management::setup_power_events(&window);

    if let Some(tray_window) = app_handle.get_webview_window("tray_menu") {
        let _ = tray_window.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)));
    }

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
            if let Err(e) = window_clone.show() {
                tracing::error!("Failed to show main window: {e}");
            }
        }
    });

    Ok(())
}

use std::sync::atomic::{AtomicBool, Ordering};

static IS_EXIT_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

pub fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "main" {
            let app_handle = window.app_handle();
            let settings = app_handle.state::<AppSettings>();

            if settings
                .is_tray_mode_enabled
                .load(Ordering::Relaxed)
            {
                api.prevent_close();
                if let Err(e) = window.hide() {
                    tracing::error!("Failed to hide window to tray: {e}");
                }
                let _ = window.emit("window-closed-to-tray", ());
            } else {
                let already_exiting = IS_EXIT_IN_PROGRESS.swap(true, Ordering::SeqCst);
                if already_exiting {
                    // Second close attempt forces immediate exit without waiting
                    tracing::info!("Repeated close request detected, forcing immediate exit");
                    crate::app::commands::quit_app(app_handle.clone());
                    return;
                }

                api.prevent_close();
                let _ = window.emit("app-exit-requested", ());

                // Spawn a fallback watchdog to force exit if frontend hangs or fails to respond
                let app_handle_clone = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(2500));
                    tracing::warn!("Frontend did not complete exit in time, forcing application exit via watchdog");
                    crate::app::commands::quit_app(app_handle_clone);
                });
            }
        }
    }
}
