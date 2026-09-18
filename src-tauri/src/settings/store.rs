use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::hash::{DefaultHasher, Hasher};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

pub struct AppSettings {
    pub is_tray_mode_enabled: AtomicBool,
    pub last_content_hash: Mutex<Option<u64>>,
    pub watcher: Mutex<Option<RecommendedWatcher>>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            is_tray_mode_enabled: AtomicBool::new(true),
            last_content_hash: Mutex::new(None),
            watcher: Mutex::new(None),
        }
    }
}

impl AppSettings {
    pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
        crate::paths::get_settings_path(app_handle)
    }

    pub fn parse_tray_mode(bytes: &[u8]) -> Option<bool> {
        serde_json::from_slice::<serde_json::Value>(bytes)
            .ok()
            .and_then(|json| json.get("isTrayModeEnabled").and_then(|v| v.as_bool()))
    }

    pub fn load_initial_tray_mode(app_handle: &tauri::AppHandle) -> bool {
        let path = match Self::get_settings_path(app_handle) {
            Ok(p) => p,
            Err(_) => {
                return true;
            }
        };

        if !path.exists() {
            return true;
        }

        if let Ok(bytes) = std::fs::read(path) {
            if let Some(is_enabled) = Self::parse_tray_mode(&bytes) {
                return is_enabled;
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

    pub fn calculate_hash(bytes: &[u8]) -> u64 {
        let mut hasher = DefaultHasher::new();
        hasher.write(bytes);
        hasher.finish()
    }

    pub fn setup_watcher(app_handle: &tauri::AppHandle) {
        // Load initial settings and synchronize in-memory tray mode state
        let is_tray_enabled = Self::load_initial_tray_mode(app_handle);
        let settings_state = app_handle.state::<AppSettings>();

        settings_state
            .is_tray_mode_enabled
            .store(is_tray_enabled, Ordering::Relaxed);

        // Track the initial content hash of settings.json
        let initial_hash = Self::get_settings_path(app_handle)
            .ok()
            .and_then(|p| std::fs::read(p).ok())
            .map(|bytes| Self::calculate_hash(&bytes));

        if let Some(hash) = initial_hash {
            if let Ok(mut guard) = settings_state.last_content_hash.lock() {
                *guard = Some(hash);
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

                    let mut read_result = std::fs::read(&target_settings_path);
                    if read_result.is_err() {
                        // On Windows, the file might briefly have a sharing lock during write/rename
                        std::thread::sleep(std::time::Duration::from_millis(20));
                        read_result = std::fs::read(&target_settings_path);
                    }

                    if let Ok(bytes) = read_result {
                        if bytes.is_empty() {
                            return;
                        }

                        let current_hash = Self::calculate_hash(&bytes);
                        let settings_state = app_handle_clone.state::<AppSettings>();
                        let is_same_content =
                            if let Ok(guard) = settings_state.last_content_hash.lock() {
                                *guard == Some(current_hash)
                            } else {
                                false
                            };

                        if !is_same_content {
                            tracing::info!("External settings.json change detected via notify");
                            if let Ok(mut guard) = settings_state.last_content_hash.lock() {
                                *guard = Some(current_hash);
                            }

                            if let Some(is_enabled) = Self::parse_tray_mode(&bytes) {
                                settings_state
                                    .is_tray_mode_enabled
                                    .store(is_enabled, Ordering::Relaxed);
                            }

                            let _ = app_handle_clone.emit("settings-external-change", ());
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_hash_determinism_and_differences() {
        let data1 = br#"{"selectedAction":"sleep"}"#;
        let data2 = br#"{"selectedAction":"sleep"}"#;
        let data3 = br#"{"selectedAction":"hibernate"}"#;

        assert_eq!(AppSettings::calculate_hash(data1), AppSettings::calculate_hash(data2));
        assert_ne!(AppSettings::calculate_hash(data1), AppSettings::calculate_hash(data3));
    }

    #[test]
    fn test_parse_tray_mode() {
        let enabled = br#"{"isTrayModeEnabled": true, "selectedAction": "sleep"}"#;
        assert_eq!(AppSettings::parse_tray_mode(enabled), Some(true));

        let disabled = br#"{"isTrayModeEnabled": false, "selectedAction": "sleep"}"#;
        assert_eq!(AppSettings::parse_tray_mode(disabled), Some(false));

        let missing = br#"{"selectedAction": "sleep"}"#;
        assert_eq!(AppSettings::parse_tray_mode(missing), None);

        let non_boolean = br#"{"isTrayModeEnabled": "yes"}"#;
        assert_eq!(AppSettings::parse_tray_mode(non_boolean), None);

        let invalid_json = b"not json";
        assert_eq!(AppSettings::parse_tray_mode(invalid_json), None);
    }
}
