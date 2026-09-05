pub mod commands;

use std::sync::OnceLock;

static IS_PORTABLE: OnceLock<bool> = OnceLock::new();

/// Determines whether WinSleep is running in portable mode.
///
/// Portable mode is active if:
/// 1. A marker file (`.portable` or `portable`) exists in the directory of the executable.
/// 2. The executable was launched with the `--portable` CLI argument.
pub fn is_portable() -> bool {
    *IS_PORTABLE.get_or_init(|| {
        if std::env::args().any(|arg| arg == "--portable") {
            return true;
        }

        if let Ok(exe_dir) = crate::paths::get_exe_dir() {
            if exe_dir.join(".portable").exists() || exe_dir.join("portable").exists() {
                return true;
            }
        }

        false
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_portable_runs() {
        let _ = is_portable();
    }
}
