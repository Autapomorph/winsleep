use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{Emitter, Manager};

pub struct AppSettings {
    pub is_tray_mode_enabled: AtomicBool,
    pub last_write_time: Mutex<Option<SystemTime>>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_tray_mode_enabled: AtomicBool::new(true),
            last_write_time: Mutex::new(None),
        }
    }
}

impl AppSettings {
    pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
        let mut path = app_handle
            .path()
            .app_config_dir()
            .map_err(|e| format!("Failed to get config directory path: {e}"))?;

        path.push("settings.json");

        Ok(path)
    }

    pub fn load_initial_tray_mode(app_handle: &tauri::AppHandle) -> bool {
        let path = match Self::get_settings_path(app_handle) {
            Ok(p) => p,
            Err(_) => return true,
        };

        if !path.exists() {
            return true;
        }

        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(is_enabled) = json.get("isTrayModeEnabled").and_then(|v| v.as_bool()) {
                    return is_enabled;
                }
            }
        }

        true
    }

    pub fn load_initial_start_minimized(app_handle: &tauri::AppHandle) -> bool {
        let path = match Self::get_settings_path(app_handle) {
            Ok(p) => p,
            Err(_) => return false,
        };

        if !path.exists() {
            return false;
        }

        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(is_enabled) = json
                    .get("isStartMinimizedEnabled")
                    .and_then(|v| v.as_bool())
                {
                    return is_enabled;
                }
            }
        }

        false
    }

    pub fn setup_watcher(app_handle: &tauri::AppHandle) {
        // Load initial settings and synchronize in-memory tray mode state
        let is_tray_enabled = Self::load_initial_tray_mode(app_handle);
        let settings_state = app_handle.state::<AppSettings>();

        settings_state
            .is_tray_mode_enabled
            .store(is_tray_enabled, Ordering::Relaxed);

        // Track the initial write time of settings.json
        let initial_write_time = Self::get_settings_path(app_handle)
            .ok()
            .and_then(|p| std::fs::metadata(p).ok())
            .and_then(|m| m.modified().ok());

        if let Some(time) = initial_write_time {
            if let Ok(mut guard) = settings_state.last_write_time.lock() {
                *guard = Some(time);
            }
        }

        // Spawn a background thread to watch for settings.json changes
        let app_handle_clone = app_handle.clone();
        std::thread::spawn(move || {
            let mut last_seen_modified = initial_write_time;

            loop {
                std::thread::sleep(std::time::Duration::from_secs(1));

                let path = match Self::get_settings_path(&app_handle_clone) {
                    Ok(p) => p,
                    Err(_) => continue,
                };

                if !path.exists() {
                    continue;
                }

                if let Ok(metadata) = std::fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        // Check if the file's modified time changed
                        if Some(modified) != last_seen_modified {
                            let settings_state = app_handle_clone.state::<AppSettings>();
                            let was_saved_by_user =
                                if let Ok(guard) = settings_state.last_write_time.lock() {
                                    *guard == Some(modified)
                                } else {
                                    false
                                };

                            // If not saved by user (i.e. modified externally), emit reload event to frontend
                            if !was_saved_by_user {
                                let _ = app_handle_clone.emit("settings-external-change", ());
                            }

                            last_seen_modified = Some(modified);
                        }
                    }
                }
            }
        });
    }
}
