use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{Emitter, Manager};

pub struct AppSettings {
    pub is_tray_mode_enabled: AtomicBool,
    pub last_write_time: Mutex<Option<SystemTime>>,
    pub watcher: Mutex<Option<RecommendedWatcher>>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_tray_mode_enabled: AtomicBool::new(true),
            last_write_time: Mutex::new(None),
            watcher: Mutex::new(None),
        }
    }
}

impl AppSettings {
    pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
        crate::paths::get_settings_path(app_handle)
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

        let config_dir = match crate::paths::get_config_dir(app_handle) {
            Ok(dir) => dir,
            Err(e) => {
                tracing::error!("Failed to get config directory for watcher: {e}");
                return;
            }
        };

        if let Err(e) = std::fs::create_dir_all(&config_dir) {
            tracing::error!("Failed to ensure config directory exists: {e}");
            return;
        }

        let app_handle_clone = app_handle.clone();
        let target_settings_path = match Self::get_settings_path(app_handle) {
            Ok(p) => p,
            Err(e) => {
                tracing::error!("Failed to get settings path for watcher: {e}");
                return;
            }
        };

        let watcher_result = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| match res {
                Ok(event) => {
                    let affects_settings = event.paths.iter().any(|p| {
                        p == &target_settings_path
                            || p.file_name() == target_settings_path.file_name()
                    });

                    if !affects_settings {
                        return;
                    }

                    if !target_settings_path.exists() {
                        return;
                    }

                    if let Ok(metadata) = std::fs::metadata(&target_settings_path) {
                        if let Ok(modified) = metadata.modified() {
                            let settings_state = app_handle_clone.state::<AppSettings>();
                            let was_saved_by_user =
                                if let Ok(guard) = settings_state.last_write_time.lock() {
                                    *guard == Some(modified)
                                } else {
                                    false
                                };

                            if !was_saved_by_user {
                                tracing::info!("External settings.json change detected via notify");
                                if let Ok(mut guard) = settings_state.last_write_time.lock() {
                                    *guard = Some(modified);
                                }
                                let _ = app_handle_clone.emit("settings-external-change", ());
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("File watcher error: {e}");
                }
            },
            Config::default(),
        );

        match watcher_result {
            Ok(mut watcher) => {
                if let Err(e) = watcher.watch(&config_dir, RecursiveMode::NonRecursive) {
                    tracing::error!("Failed to watch config directory {config_dir:?}: {e}");
                } else {
                    tracing::info!("Started reactive file watcher on {config_dir:?}");
                    if let Ok(mut guard) = settings_state.watcher.lock() {
                        *guard = Some(watcher);
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to create file watcher: {e}");
            }
        }
    }
}
