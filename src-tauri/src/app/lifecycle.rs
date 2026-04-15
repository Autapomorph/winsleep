use crate::app::window;
use crate::logging;
use crate::settings::AppSettings;
use crate::tray;
use tauri::Manager;

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();

    let guard = logging::init(app_handle)?;
    app_handle.manage(guard);

    AppSettings::setup_watcher(app_handle);

    window::setup_window(app_handle)?;
    tray::setup(app)?;

    Ok(())
}
