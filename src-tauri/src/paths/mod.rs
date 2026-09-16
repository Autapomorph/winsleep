use std::path::PathBuf;
use tauri::Manager;

/// Returns the directory containing the currently running executable.
pub fn get_exe_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {e}"))?;

    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "Failed to get executable parent directory".to_string())?;

    Ok(exe_dir.to_path_buf())
}

/// Returns the root configuration directory.
/// In portable mode, this is the directory containing the executable.
/// In installed mode, this is the standard Tauri `app_config_dir`.
pub fn get_config_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    if crate::system::is_portable() {
        return get_exe_dir();
    }

    app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory path: {e}"))
}

/// Returns the path to `settings.json`.
pub fn get_settings_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_config_dir(app_handle)?;
    path.push("settings.json");
    Ok(path)
}

/// Returns the path to `state.json`.
pub fn get_app_state_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_config_dir(app_handle)?;
    path.push("state.json");
    Ok(path)
}

/// Returns the directory where log files should be stored.
/// In portable mode, this is `<exe_dir>/logs`.
/// In installed mode, this is the standard Tauri `app_log_dir`.
pub fn get_log_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    if crate::system::is_portable() {
        let mut path = get_exe_dir()?;
        path.push("logs");
        return Ok(path);
    }

    app_handle
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory path: {e}"))
}

/// Safely writes content to `path` atomically.
///
/// 1. Creates parent directories if missing.
/// 2. Writes data to a temporary file located in the exact same directory (ensuring same disk partition).
/// 3. Flushes and syncs data to physical disk via `sync_all()`.
/// 4. Atomically replaces target file using `std::fs::rename`.
pub fn atomic_write(path: &std::path::Path, content: &[u8]) -> Result<(), String> {
    use std::io::Write;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory {:?}: {e}", parent))?;
        }
    }

    let file_name = path
        .file_name()
        .ok_or_else(|| format!("Invalid file path: {:?}", path))?
        .to_string_lossy();

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let pid = std::process::id();
    let tmp_path = path.with_file_name(format!(".{file_name}.tmp.{nanos}_{pid}"));

    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&tmp_path)
        .map_err(|e| format!("Failed to create temporary file {:?}: {e}", tmp_path))?;

    if let Err(e) = file.write_all(content) {
        let _ = std::fs::remove_file(&tmp_path);
        return Err(format!("Failed to write data to {:?}: {e}", tmp_path));
    }

    if let Err(e) = file.sync_all() {
        let _ = std::fs::remove_file(&tmp_path);
        return Err(format!("Failed to flush data to disk for {:?}: {e}", tmp_path));
    }

    drop(file);

    // If target path already exists, ensure it is not marked read-only on Windows
    if path.exists() {
        if let Ok(metadata) = std::fs::metadata(path) {
            let mut permissions = metadata.permissions();
            if permissions.readonly() {
                permissions.set_readonly(false);
                let _ = std::fs::set_permissions(path, permissions);
            }
        }
    }

    // Attempt to rename with retry loop for Windows sharing violations / transient locks
    const MAX_RETRIES: u32 = 10;
    let mut attempt = 0;
    loop {
        match std::fs::rename(&tmp_path, path) {
            Ok(()) => return Ok(()),
            Err(_e) if attempt < MAX_RETRIES => {
                attempt += 1;
                std::thread::sleep(std::time::Duration::from_millis(15 * attempt as u64));
            }
            Err(e) => {
                let _ = std::fs::remove_file(&tmp_path);
                return Err(format!(
                    "Failed to rename {:?} to {:?} after {attempt} retries: {e}",
                    tmp_path, path
                ));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_atomic_write_new_and_overwrite() {
        let unique_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!("winsleep_test_{}_{}", std::process::id(), unique_id));
        let test_file = temp_dir.join("test_file.json");

        let content = b"{\"key\":\"value\"}";
        assert!(atomic_write(&test_file, content).is_ok());

        let read_back = std::fs::read(&test_file).unwrap();
        assert_eq!(read_back, content);

        // Overwrite atomically
        let new_content = b"{\"key\":\"updated\"}";
        assert!(atomic_write(&test_file, new_content).is_ok());

        let updated_read = std::fs::read(&test_file).unwrap();
        assert_eq!(updated_read, new_content);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}

