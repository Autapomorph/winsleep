use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

fn is_valid_log_file(name: &str) -> bool {
    // Expected format: "WinSleep.YYYY-MM-DD.log"
    // e.g. length of "WinSleep.2026-07-19.log" is 23.
    if name.len() != 23 {
        return false;
    }
    if !name.starts_with("WinSleep.") || !name.ends_with(".log") {
        return false;
    }

    // Check if the middle part YYYY-MM-DD has digits and dashes at correct places
    let date_part = &name[9..19];
    let mut chars = date_part.chars();

    for i in 0..10 {
        let c = chars.next().unwrap_or(' ');
        if i == 4 || i == 7 {
            if c != '-' {
                return false;
            }
        } else if !c.is_ascii_digit() {
            return false;
        }
    }

    true
}

fn get_sorted_log_files(app_handle: &tauri::AppHandle) -> Result<Vec<PathBuf>, String> {
    let log_dir = app_handle
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory path: {e}"))?;

    if !log_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();

    for entry in fs::read_dir(&log_dir).map_err(|e| format!("Failed to read log directory: {e}"))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
        let path = entry.path();
        if path.is_file() {
            if let Some(filename_os) = path.file_name() {
                let filename = filename_os.to_string_lossy();
                if is_valid_log_file(&filename) {
                    files.push(path);
                }
            }
        }
    }

    // Sort alphabetically descending (newest file first)
    files.sort_by(|a, b| {
        let a_name = a.file_name().unwrap_or_default().to_string_lossy();
        let b_name = b.file_name().unwrap_or_default().to_string_lossy();
        b_name.cmp(&a_name)
    });

    Ok(files)
}

#[tauri::command]
pub fn open_log_dir(app_handle: tauri::AppHandle) -> Result<(), String> {
    let log_dir = app_handle
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory path: {e}"))?;

    if !log_dir.exists() {
        fs::create_dir_all(&log_dir).map_err(|e| format!("Failed to create log directory: {e}"))?;
    }

    app_handle
        .opener()
        .open_path(log_dir.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| format!("Failed to open log directory: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn read_logs(app_handle: tauri::AppHandle) -> Result<String, String> {
    let files = get_sorted_log_files(&app_handle)?;
    if files.is_empty() {
        return Ok(String::new());
    }

    let mut loaded_contents = Vec::new();
    let mut total_lines = 0;
    const MAX_LINES_LIMIT: usize = 3000;

    for (index, path) in files.iter().enumerate() {
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read log file {:?}: {e}", path.file_name()))?;

        let line_count = content.lines().count();
        loaded_contents.push(content);
        total_lines += line_count;

        // The first file (index 0) is today's active file. We always load it fully.
        // For older files, we stop if we have exceeded the combined limit.
        if index > 0 && total_lines >= MAX_LINES_LIMIT {
            break;
        }
    }

    // Reverse the order of loaded files to merge them chronologically (oldest first)
    loaded_contents.reverse();

    let combined = loaded_contents.join("");

    Ok(combined)
}

#[tauri::command]
pub fn clear_logs(app_handle: tauri::AppHandle) -> Result<(), String> {
    let files = get_sorted_log_files(&app_handle)?;
    if files.is_empty() {
        return Ok(());
    }

    // Truncate today's active log file (index 0)
    let newest_path = &files[0];
    let file = fs::OpenOptions::new()
        .write(true)
        .open(newest_path)
        .map_err(|e| format!("Failed to open active log file for clearing: {e}"))?;

    file.set_len(0)
        .map_err(|e| format!("Failed to truncate active log file: {e}"))?;

    // Delete all older historical log files
    for path in files.iter().skip(1) {
        let _ = fs::remove_file(path);
    }

    Ok(())
}

#[tauri::command]
pub fn log_message(level: String, message: String) {
    match level.to_uppercase().as_str() {
        "TRACE" => tracing::trace!("{}", message),
        "DEBUG" => tracing::debug!("{}", message),
        "INFO" => tracing::info!("{}", message),
        "WARN" => tracing::warn!("{}", message),
        "ERROR" => tracing::error!("{}", message),
        _ => tracing::info!("{}", message),
    }
}
