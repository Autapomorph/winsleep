mod app;
mod logging;
mod notifications;
mod pc_management;
mod settings;
mod timer;
mod tray;

use settings::AppSettings;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            logging::commands::log_message,
            logging::commands::read_logs,
            logging::commands::clear_logs,
            logging::commands::open_log_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
