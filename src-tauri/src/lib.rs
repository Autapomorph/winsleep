mod app;
mod app_state;
mod logging;
mod notifications;
mod paths;
mod pc_management;
mod settings;
mod system;
mod timer;
mod tray;

use settings::AppSettings;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if system::is_portable() {
        if let Ok(exe_dir) = paths::get_exe_dir() {
            if std::env::var("WEBVIEW2_USER_DATA_FOLDER").is_err() {
                let webview_dir = exe_dir.join("data").join("webview");
                std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", webview_dir);
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let window = app.get_webview_window("main").expect("no main window");
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .args(["--autostart"])
                .build(),
        )
        .manage(AppSettings::default())
        .manage(timer::state::ManagedTimer::default())
        .setup(move |app| app::setup(app))
        .on_window_event(|window, event| app::handle_window_event(window, event))
        .invoke_handler(tauri::generate_handler![
            timer::commands::start_timer,
            timer::commands::cancel_timer,
            pc_management::commands::pc_sleep,
            pc_management::commands::pc_hibernate,
            pc_management::commands::pc_shutdown,
            pc_management::commands::pc_reboot,
            pc_management::commands::pc_lock,
            pc_management::commands::pc_signout,
            notifications::commands::play_notification_sound,
            app::commands::quit_app,
            tray::commands::set_is_tray_mode_enabled,
            tray::commands::update_tray_menu,
            settings::commands::load_settings,
            settings::commands::save_settings,
            settings::commands::open_settings_dir,
            app_state::commands::load_app_state,
            app_state::commands::save_app_state,
            logging::commands::log_message,
            logging::commands::read_logs,
            logging::commands::clear_logs,
            logging::commands::open_log_dir,
            system::commands::is_portable
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
