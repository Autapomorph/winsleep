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

fn is_clear_marker_line(line: &str) -> bool {
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(line) {
        if let Some(msg) = value.get("message").and_then(|m| m.as_str()) {
            return msg.trim() == CLEAR_LOGS_MARKER;
        }
    }

    line.trim() == CLEAR_LOGS_MARKER
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

    let mut result_lines_rev = Vec::new();
    let mut hit_marker = false;
    let mut current_end = file_len;
    let mut remainder: Vec<u8> = Vec::new();

    // Read in chunks backwards until max_lines satisfied, marker hit, or file beginning reached
    const CHUNK_SIZE: u64 = 64 * 1024;
    let mut chunk = Vec::with_capacity(CHUNK_SIZE as usize + 4096);

    while current_end > 0 && result_lines_rev.len() < max_lines && !hit_marker {
        let read_len = current_end.min(CHUNK_SIZE);
        let seek_pos = current_end - read_len;

        file.seek(SeekFrom::Start(seek_pos))
            .map_err(|e| format!("Failed to seek in log file {:?}: {e}", path.file_name()))?;

        chunk.resize(read_len as usize, 0);
        file.read_exact(&mut chunk[..read_len as usize])
            .map_err(|e| format!("Failed to read log file {:?}: {e}", path.file_name()))?;

        if !remainder.is_empty() {
            chunk.extend_from_slice(&remainder);
            remainder.clear();
        }

        let mut slice = &chunk[..];

        // If we sought into the middle of the file (seek_pos > 0), the bytes before the
        // first newline might be an incomplete line that continues into the preceding chunk.
        if seek_pos > 0 {
            if let Some(first_newline_idx) = slice.iter().position(|&b| b == b'\n') {
                remainder.clear();
                remainder.extend_from_slice(&slice[..first_newline_idx]);
                slice = &slice[first_newline_idx + 1..];
            } else {
                remainder.clear();
                remainder.extend_from_slice(slice);
                current_end = seek_pos;
                continue;
            }
        }

        for line_bytes in slice.split(|&b| b == b'\n').rev() {
            let line_bytes = if line_bytes.ends_with(b"\r") {
                &line_bytes[..line_bytes.len() - 1]
            } else {
                line_bytes
            };

            let line_str = String::from_utf8_lossy(line_bytes).replace('\0', "");
            let trimmed = line_str.trim();
            if trimmed.is_empty() {
                continue;
            }

            if trimmed.contains(CLEAR_LOGS_MARKER) && is_clear_marker_line(trimmed) {
                hit_marker = true;
                break;
            }

            result_lines_rev.push(trimmed.to_string());
            if result_lines_rev.len() >= max_lines {
                break;
            }
        }

        current_end = seek_pos;
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
        let max_for_this_file = needed.saturating_sub(skipped + collected_rev.len());
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

        if has_more {
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

    // Mark the active log as cleared without corrupting the open file handle in tracing-appender.
    // Using CLEAR_LOGS_TARGET ensures this marker bypasses any user-defined EnvFilter log levels.
    tracing::info!(target: super::CLEAR_LOGS_TARGET, "{CLEAR_LOGS_MARKER}");

    // Wait briefly until the marker is flushed to disk by the non-blocking worker,
    // ensuring an immediate subsequent read_logs call will observe the cleared state.
    if let Some(active_file) = files.first() {
        for _ in 0..20 {
            std::thread::sleep(std::time::Duration::from_millis(10));
            if let Ok((_, hit_marker)) = read_lines_from_tail_rev(active_file, 5) {
                if hit_marker {
                    break;
                }
            }
        }
    }

    Ok(())
}

pub fn sanitize_log_message(message: &str) -> String {
    if message.trim() == CLEAR_LOGS_MARKER {
        format!("[sanitized] {message}")
    } else {
        message.to_string()
    }
}

#[tauri::command]
pub fn log_message(level: String, message: String) {
    let message = sanitize_log_message(&message);

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

    #[test]
    fn test_read_lines_from_tail_rev_large_file_across_chunks() {
        // Generate enough lines to exceed CHUNK_SIZE (64KB)
        let mut content = String::new();
        for i in 0..1000 {
            content.push_str(&format!("log line number {i:04} with extra padding content\n"));
        }
        let (_dir, file_path) = create_temp_log_file(&content);

        // Read 100 lines
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 100).unwrap();
        assert_eq!(lines.len(), 100);
        assert_eq!(lines[0], "log line number 0999 with extra padding content");
        assert_eq!(lines[99], "log line number 0900 with extra padding content");
        assert!(!hit_marker);

        // Read all 1000 lines (spans multiple 64KB chunks)
        let (all_lines, hit_marker_all) = read_lines_from_tail_rev(&file_path, 1500).unwrap();
        assert_eq!(all_lines.len(), 1000);
        assert_eq!(all_lines[0], "log line number 0999 with extra padding content");
        assert_eq!(all_lines[999], "log line number 0000 with extra padding content");
        assert!(!hit_marker_all);
    }

    #[test]
    fn test_read_lines_from_tail_rev_multibyte_utf8_across_chunks() {
        // Position a 2-byte Cyrillic character exactly across the 64KB (65536 bytes) chunk boundary
        // Total bytes after boundary: 65536
        // Preceding part: padding to place a multi-byte UTF-8 character right at the 64KB boundary
        let mut content = "A".repeat(65536 - 3);
        // "Тест" in UTF-8 is 8 bytes (2 bytes per character)
        content.push_str("Тест многобайтового UTF-8\n");
        content.push_str("Вторая строка кириллицы\n");

        let (_dir, file_path) = create_temp_log_file(&content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();

        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0], "Вторая строка кириллицы");
        assert!(lines[1].ends_with("Тест многобайтового UTF-8"));
        assert!(!lines[1].contains('\u{FFFD}'), "UTF-8 corrupted with replacement char");
        assert!(!hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_ignores_marker_substring_in_json() {
        let content = format!(
            "{{\"message\":\"line 1\"}}\n{{\"message\":\"Warning: contains {CLEAR_LOGS_MARKER} as substring\"}}\n{{\"message\":\"line 2\"}}\n"
        );
        let (_dir, file_path) = create_temp_log_file(&content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        assert_eq!(
            lines,
            vec![
                "{\"message\":\"line 2\"}",
                &format!("{{\"message\":\"Warning: contains {CLEAR_LOGS_MARKER} as substring\"}}"),
                "{\"message\":\"line 1\"}"
            ]
        );
        assert!(!hit_marker);
    }

    #[test]
    fn test_read_lines_from_tail_rev_ignores_marker_substring_in_plain_text() {
        let content = format!("line 1\nsome error: {CLEAR_LOGS_MARKER} not found\nline 2\n");
        let (_dir, file_path) = create_temp_log_file(&content);
        let (lines, hit_marker) = read_lines_from_tail_rev(&file_path, 10).unwrap();
        assert_eq!(
            lines,
            vec![
                "line 2",
                &format!("some error: {CLEAR_LOGS_MARKER} not found"),
                "line 1"
            ]
        );
        assert!(!hit_marker);
    }

    #[test]
    fn test_sanitize_log_message() {
        assert_eq!(
            sanitize_log_message(CLEAR_LOGS_MARKER),
            format!("[sanitized] {CLEAR_LOGS_MARKER}")
        );
        assert_eq!(
            sanitize_log_message(&format!("  {CLEAR_LOGS_MARKER}  ")),
            format!("[sanitized]   {CLEAR_LOGS_MARKER}  ")
        );
        assert_eq!(
            sanitize_log_message("Regular log message"),
            "Regular log message"
        );
    }
}

