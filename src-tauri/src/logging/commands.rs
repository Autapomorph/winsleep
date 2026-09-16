use std::fs;
use std::path::PathBuf;
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
    let log_dir = crate::paths::get_log_dir(app_handle)?;

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
    let log_dir = crate::paths::get_log_dir(&app_handle)?;

    if !log_dir.exists() {
        fs::create_dir_all(&log_dir).map_err(|e| format!("Failed to create log directory: {e}"))?;
    }

    app_handle
        .opener()
        .open_path(log_dir.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| format!("Failed to open log directory: {e}"))?;

    Ok(())
}

pub const CLEAR_LOGS_MARKER: &str = "__WINSLEEP_LOGS_CLEARED__";
pub const DEFAULT_PAGE_LIMIT: usize = 1000;
pub const MAX_PAGE_LIMIT: usize = 2000;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogChunk {
    pub data: String,
    pub has_more: bool,
}

/// Reads up to `max_lines` from the tail of the log file at `path` in reverse order
/// (newest line first).
/// Returns `(lines_rev, hit_clear_marker)`.
/// If `hit_clear_marker` is true, all logs before the marker in this and older files should be ignored.
fn read_lines_from_tail_rev(
    path: &std::path::Path,
    max_lines: usize,
) -> Result<(Vec<String>, bool), String> {
    use std::fs::File;
    use std::io::{Read, Seek, SeekFrom};

    if max_lines == 0 {
        return Ok((Vec::new(), false));
    }

    let mut file = File::open(path)
        .map_err(|e| format!("Failed to open log file {:?}: {e}", path.file_name()))?;

    let file_len = file
        .metadata()
        .map_err(|e| format!("Failed to get metadata for {:?}: {e}", path.file_name()))?
        .len();

    if file_len == 0 {
        return Ok((Vec::new(), false));
    }

    // Estimate bytes needed with safety factor (~1KB per line, min 1MB, max 16MB)
    let estimated_bytes = (max_lines as u64 * 1024).clamp(1024 * 1024, 16 * 1024 * 1024);
    let read_len = file_len.min(estimated_bytes);
    let seek_pos = file_len - read_len;

    file.seek(SeekFrom::Start(seek_pos))
        .map_err(|e| format!("Failed to seek in log file {:?}: {e}", path.file_name()))?;

    let mut buffer = Vec::with_capacity(read_len as usize);
    file.take(read_len)
        .read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read log file {:?}: {e}", path.file_name()))?;

    let raw_text = String::from_utf8_lossy(&buffer);
    let sanitized = if raw_text.contains('\0') {
        raw_text.replace('\0', "")
    } else {
        raw_text.to_string()
    };

    let mut all_lines: Vec<&str> = sanitized.lines().collect();
    // If we sought into the middle of the file, the first slice is likely an incomplete partial line
    if seek_pos > 0 && !all_lines.is_empty() {
        all_lines.remove(0);
    }

    let mut result_lines_rev = Vec::new();
    let mut hit_marker = false;

    for line in all_lines.into_iter().rev() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.contains(CLEAR_LOGS_MARKER) {
            hit_marker = true;
            break;
        }

        result_lines_rev.push(trimmed.to_string());
        if result_lines_rev.len() >= max_lines {
            break;
        }
    }

    Ok((result_lines_rev, hit_marker))
}

#[tauri::command]
pub fn read_logs(
    app_handle: tauri::AppHandle,
    offset: Option<usize>,
    limit: Option<usize>,
) -> Result<LogChunk, String> {
    let files = get_sorted_log_files(&app_handle)?;
    if files.is_empty() {
        return Ok(LogChunk {
            data: String::new(),
            has_more: false,
        });
    }

    let offset = offset.unwrap_or(0);
    let limit = limit.unwrap_or(DEFAULT_PAGE_LIMIT).clamp(1, MAX_PAGE_LIMIT);
    let needed = offset + limit + 1; // +1 to probe if more lines exist

    let mut skipped = 0;
    let mut collected_rev = Vec::with_capacity(limit);
    let mut has_more = false;

    for path in files {
        if collected_rev.len() == limit && has_more {
            break;
        }

        let max_for_this_file = needed.saturating_sub(skipped + collected_rev.len());
        if max_for_this_file == 0 && has_more {
            break;
        }

        let (lines_rev, hit_marker) = read_lines_from_tail_rev(&path, max_for_this_file + 1)?;

        for line in lines_rev {
            if skipped < offset {
                skipped += 1;
            } else if collected_rev.len() < limit {
                collected_rev.push(line);
            } else {
                has_more = true;
                break;
            }
        }

        if hit_marker {
            // All logs before this marker are considered cleared, so no more can exist
            has_more = false;
            break;
        }
    }

    // Reverse collected lines to return them in chronological order (oldest first)
    collected_rev.reverse();

    let mut data = collected_rev.join("\n");
    if !data.is_empty() {
        data.push('\n');
    }

    Ok(LogChunk { data, has_more })
}

#[tauri::command]
pub fn clear_logs(app_handle: tauri::AppHandle) -> Result<(), String> {
    let files = get_sorted_log_files(&app_handle)?;
    if files.is_empty() {
        return Ok(());
    }

    // Delete all older historical log files
    for path in files.iter().skip(1) {
        let _ = fs::remove_file(path);
    }

    // Mark the active log as cleared without corrupting the open file handle in tracing-appender
    tracing::info!("{CLEAR_LOGS_MARKER}");

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    struct TempDirGuard(std::path::PathBuf);

    impl Drop for TempDirGuard {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn create_temp_log_file(content: &str) -> (TempDirGuard, std::path::PathBuf) {
        let unique_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!(
            "winsleep_log_test_{}_{}",
            std::process::id(),
            unique_id
        ));
        std::fs::create_dir_all(&temp_dir).expect("failed to create temp dir");
        let file_path = temp_dir.join("WinSleep.2026-09-16.log");
        let mut file = std::fs::File::create(&file_path).expect("failed to create temp log file");
        file.write_all(content.as_bytes())
            .expect("failed to write temp log file");
        (TempDirGuard(temp_dir), file_path)
    }

    #[test]
    fn test_read_lines_from_tail_rev_empty_file() {
        let (_dir, file_path) = create_temp_log_file("");
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        assert!(lines.is_empty());
        assert!(!hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_fewer_lines_than_max() {
        let content = "line 1\nline 2\nline 3\n";
        let (_dir, file_path) = create_temp_log_file(content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        // Returned in reverse order (newest first)
        assert_eq!(lines, vec!["line 3", "line 2", "line 1"]);
        assert!(!hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_more_lines_than_max() {
        let content = "line 1\nline 2\nline 3\nline 4\nline 5\n";
        let (_dir, file_path) = create_temp_log_file(content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 3).unwrap();
        // Newest 3 lines in reverse order
        assert_eq!(lines, vec!["line 5", "line 4", "line 3"]);
        assert!(!hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_with_clear_marker() {
        let content = format!("line 1\nline 2\n{CLEAR_LOGS_MARKER}\nline 3\nline 4\n");
        let (_dir, file_path) = create_temp_log_file(&content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        // Only lines after the marker, in reverse order
        assert_eq!(lines, vec!["line 4", "line 3"]);
        assert!(hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_with_clear_marker_inside_json() {
        let content = format!(
            "{{\"message\":\"old\"}}\n{{\"message\":\"{CLEAR_LOGS_MARKER}\"}}\n{{\"message\":\"new\"}}\n"
        );
        let (_dir, file_path) = create_temp_log_file(&content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        assert_eq!(lines, vec!["{\"message\":\"new\"}"]);
        assert!(hit_marker);
    }
}

