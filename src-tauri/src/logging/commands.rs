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
pub struct LogCursor {
    pub file_name: String,
    pub byte_offset: u64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogChunk {
    pub data: String,
    pub has_more: bool,
    pub cursor: Option<LogCursor>,
}

fn is_clear_marker_line(line: &str) -> bool {
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(line) {
        if let Some(msg) = value.get("message").and_then(|m| m.as_str()) {
            return msg.trim() == CLEAR_LOGS_MARKER;
        }
    }

    line.trim() == CLEAR_LOGS_MARKER
}

/// Reads up to `max_lines` from the log file at `path` before `end_offset` in reverse order
/// (newest line first).
/// Returns `(lines_rev, hit_clear_marker, oldest_line_offset)`.
/// If `hit_clear_marker` is true, all logs before the marker in this and older files should be ignored.
/// `oldest_line_offset` is the file byte offset where the oldest collected line starts, or 0 if start of file reached.
fn read_lines_before_offset_rev(
    path: &std::path::Path,
    end_offset: u64,
    max_lines: usize,
) -> Result<(Vec<String>, bool, u64), String> {
    use std::fs::File;
    use std::io::{Read, Seek, SeekFrom};

    if max_lines == 0 || end_offset == 0 {
        return Ok((Vec::new(), false, 0));
    }

    let mut file = File::open(path)
        .map_err(|e| format!("Failed to open log file {:?}: {e}", path.file_name()))?;

    let file_len = file
        .metadata()
        .map_err(|e| format!("Failed to get metadata for {:?}: {e}", path.file_name()))?
        .len();

    if file_len == 0 {
        return Ok((Vec::new(), false, 0));
    }

    let mut result_lines_rev = Vec::new();
    let mut hit_marker = false;
    let mut current_end = end_offset.min(file_len);
    let mut remainder: Vec<u8> = Vec::new();
    let mut oldest_line_offset = current_end;

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

        let (slice_start, slice_file_offset) = if seek_pos > 0 {
            if let Some(first_newline_idx) = chunk.iter().position(|&b| b == b'\n') {
                remainder.clear();
                remainder.extend_from_slice(&chunk[..first_newline_idx]);
                (first_newline_idx + 1, seek_pos + (first_newline_idx + 1) as u64)
            } else {
                remainder.clear();
                remainder.extend_from_slice(&chunk);
                current_end = seek_pos;
                continue;
            }
        } else {
            (0, 0u64)
        };

        let slice = &chunk[slice_start..];

        // Find all line boundaries in slice
        let mut line_ranges = Vec::new();
        let mut line_start = 0;
        for (i, &b) in slice.iter().enumerate() {
            if b == b'\n' {
                line_ranges.push((line_start, i));
                line_start = i + 1;
            }
        }
        if line_start < slice.len() {
            line_ranges.push((line_start, slice.len()));
        }

        for (start, end) in line_ranges.into_iter().rev() {
            let line_bytes = &slice[start..end];
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
                oldest_line_offset = slice_file_offset + start as u64;
                break;
            }

            result_lines_rev.push(trimmed.to_string());
            oldest_line_offset = slice_file_offset + start as u64;

            if result_lines_rev.len() >= max_lines {
                break;
            }
        }

        current_end = seek_pos;
    }

    if current_end == 0 && !hit_marker && result_lines_rev.len() < max_lines {
        oldest_line_offset = 0;
    }

    Ok((result_lines_rev, hit_marker, oldest_line_offset))
}

/// Reads up to `max_lines` from the tail of the log file at `path` in reverse order
/// (newest line first).
/// Returns `(lines_rev, hit_clear_marker)`.
/// If `hit_clear_marker` is true, all logs before the marker in this and older files should be ignored.
fn read_lines_from_tail_rev(
    path: &std::path::Path,
    max_lines: usize,
) -> Result<(Vec<String>, bool), String> {
    let (lines, hit_marker, _) = read_lines_before_offset_rev(path, u64::MAX, max_lines)?;
    Ok((lines, hit_marker))
}

#[tauri::command]
pub fn read_logs(
    app_handle: tauri::AppHandle,
    offset: Option<usize>,
    limit: Option<usize>,
    cursor: Option<LogCursor>,
) -> Result<LogChunk, String> {
    let files = get_sorted_log_files(&app_handle)?;
    if files.is_empty() {
        return Ok(LogChunk {
            data: String::new(),
            has_more: false,
            cursor: None,
        });
    }

    let limit = limit.unwrap_or(DEFAULT_PAGE_LIMIT).clamp(1, MAX_PAGE_LIMIT);

    // If offset > 0 without a cursor is explicitly requested, preserve legacy offset-from-tail logic
    if offset.unwrap_or(0) > 0 && cursor.is_none() {
        let offset = offset.unwrap();
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
                has_more = false;
                break;
            }

            if has_more {
                break;
            }
        }

        collected_rev.reverse();
        let mut data = collected_rev.join("\n");
        if !data.is_empty() {
            data.push('\n');
        }

        return Ok(LogChunk {
            data,
            has_more,
            cursor: None,
        });
    }

    // Cursor-based or initial tail read
    let (start_file_idx, initial_offset) = if let Some(ref cur) = cursor {
        let idx = files
            .iter()
            .position(|p| {
                p.file_name().map(|n| n.to_string_lossy()) == Some(cur.file_name.as_str().into())
            })
            .or_else(|| {
                // If cursor file was deleted/rotated, advance to the next older file
                files.iter().position(|p| {
                    let name = p.file_name().unwrap_or_default().to_string_lossy();
                    name.as_ref() < cur.file_name.as_str()
                })
            });

        match idx {
            Some(i) => (i, cur.byte_offset),
            None => {
                return Ok(LogChunk {
                    data: String::new(),
                    has_more: false,
                    cursor: None,
                });
            }
        }
    } else {
        (0, u64::MAX)
    };

    let mut collected_rev = Vec::with_capacity(limit);
    let mut has_more = false;
    let mut next_cursor: Option<LogCursor> = None;

    for (i, path) in files.iter().enumerate().skip(start_file_idx) {
        let file_name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let end_offset = if i == start_file_idx && cursor.as_ref().map(|c| c.file_name.as_str()) == Some(&file_name) {
            initial_offset
        } else {
            u64::MAX
        };

        if end_offset == 0 {
            // Already read this file to its start, continue to older files
            continue;
        }

        let needed_for_this_file = (limit - collected_rev.len()) + 1;
        let (lines_rev, hit_marker, oldest_offset) =
            read_lines_before_offset_rev(path, end_offset, needed_for_this_file)?;

        for line in lines_rev {
            if collected_rev.len() < limit {
                collected_rev.push(line);
            } else {
                has_more = true;
                break;
            }
        }

        if !collected_rev.is_empty() {
            next_cursor = Some(LogCursor {
                file_name: file_name.clone(),
                byte_offset: oldest_offset,
            });
        }

        if hit_marker {
            has_more = false;
            break;
        }

        if has_more {
            break;
        }

        if oldest_offset > 0 && collected_rev.len() >= limit {
            has_more = true;
            break;
        }
    }

    if !has_more && !collected_rev.is_empty() {
        if let Some(cur) = &next_cursor {
            if cur.byte_offset > 0 {
                has_more = true;
            } else if let Some(cur_idx) = files.iter().position(|p| {
                p.file_name().map(|n| n.to_string_lossy()) == Some(cur.file_name.as_str().into())
            }) {
                if cur_idx + 1 < files.len() {
                    has_more = true;
                }
            }
        }
    }

    collected_rev.reverse();

    let mut data = collected_rev.join("\n");
    if !data.is_empty() {
        data.push('\n');
    }

    if !has_more {
        next_cursor = None;
    }

    Ok(LogChunk {
        data,
        has_more,
        cursor: next_cursor,
    })
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

    #[test]
    fn test_read_lines_before_offset_rev_pagination_exactness() {
        let content = "line 0\nline 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\n";
        let (_dir, file_path) = create_temp_log_file(content);

        // Batch 1: newest 4 lines
        let (batch1_rev, hit_marker1, offset1) =
            read_lines_before_offset_rev(&file_path, u64::MAX, 4).unwrap();
        assert!(!hit_marker1);
        assert_eq!(batch1_rev, vec!["line 9", "line 8", "line 7", "line 6"]);
        assert!(offset1 > 0);

        // Batch 2: next 4 older lines before offset1
        let (batch2_rev, hit_marker2, offset2) =
            read_lines_before_offset_rev(&file_path, offset1, 4).unwrap();
        assert!(!hit_marker2);
        assert_eq!(batch2_rev, vec!["line 5", "line 4", "line 3", "line 2"]);
        assert!(offset2 > 0);

        // Batch 3: remaining lines before offset2
        let (batch3_rev, hit_marker3, offset3) =
            read_lines_before_offset_rev(&file_path, offset2, 4).unwrap();
        assert!(!hit_marker3);
        assert_eq!(batch3_rev, vec!["line 1", "line 0"]);
        assert_eq!(offset3, 0); // Reached start of file

        // Batch 4: reading before offset 0 returns empty
        let (batch4_rev, hit_marker4, offset4) =
            read_lines_before_offset_rev(&file_path, offset3, 4).unwrap();
        assert!(!hit_marker4);
        assert!(batch4_rev.is_empty());
        assert_eq!(offset4, 0);
    }

    #[test]
    fn test_cursor_pagination_immune_to_appended_lines() {
        let (_dir, file_path) = create_temp_log_file("line 0\nline 1\nline 2\nline 3\nline 4\n");

        // Step 1: Read latest 2 lines (lines 4 and 3)
        let (batch1_rev, _, offset1) =
            read_lines_before_offset_rev(&file_path, u64::MAX, 2).unwrap();
        assert_eq!(batch1_rev, vec!["line 4", "line 3"]);

        // Step 2: Append 3 NEW lines to the tail of the log file
        {
            let mut file = std::fs::OpenOptions::new()
                .append(true)
                .open(&file_path)
                .unwrap();
            file.write_all(b"line 5 (new)\nline 6 (new)\nline 7 (new)\n")
                .unwrap();
            file.flush().unwrap();
        }

        // Step 3: Read older lines using the offset saved from Step 1.
        // Even though new lines were added at the tail, reading before offset1 MUST yield lines 2 and 1!
        let (batch2_rev, _, offset2) =
            read_lines_before_offset_rev(&file_path, offset1, 2).unwrap();
        assert_eq!(batch2_rev, vec!["line 2", "line 1"]);

        // Step 4: Read oldest remaining line
        let (batch3_rev, _, offset3) =
            read_lines_before_offset_rev(&file_path, offset2, 2).unwrap();
        assert_eq!(batch3_rev, vec!["line 0"]);
        assert_eq!(offset3, 0);
    }
}

