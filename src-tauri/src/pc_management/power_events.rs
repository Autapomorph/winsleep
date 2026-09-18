use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows_sys::Win32::UI::WindowsAndMessaging::{WM_NCDESTROY, WM_POWERBROADCAST};

const PBT_APMRESUMESUSPEND: usize = 0x0007;
const PBT_APMRESUMESTANDBY: usize = 0x000F;
const PBT_APMRESUMEAUTOMATIC: usize = 0x0012;

const POWER_EVENTS_SUBCLASS_ID: usize = 1;
const RESUME_DEBOUNCE_DURATION: std::time::Duration = std::time::Duration::from_secs(2);

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static LAST_RESUME: std::sync::Mutex<Option<std::time::Instant>> = std::sync::Mutex::new(None);

pub fn should_emit_resume(
    last_resume: &mut Option<std::time::Instant>,
    now: std::time::Instant,
    debounce_duration: std::time::Duration,
) -> bool {
    match *last_resume {
        Some(last) if now.saturating_duration_since(last) < debounce_duration => false,
        _ => {
            *last_resume = Some(now);
            true
        }
    }
}

unsafe extern "system" fn power_subclass_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    uid: usize,
    _ref_data: usize,
) -> LRESULT {
    if msg == WM_POWERBROADCAST {
        let event_type = wparam;
        if event_type == PBT_APMRESUMEAUTOMATIC
            || event_type == PBT_APMRESUMESTANDBY
            || event_type == PBT_APMRESUMESUSPEND
        {
            let now = std::time::Instant::now();
            let mut should_emit = false;

            if let Ok(mut last_time) = LAST_RESUME.lock() {
                should_emit = should_emit_resume(&mut last_time, now, RESUME_DEBOUNCE_DURATION);
            }

            if should_emit {
                if let Some(app) = APP_HANDLE.get() {
                    tracing::info!(
                        "System resume event received ({event_type:#x}), emitting system-resume"
                    );
                    let _ = app.emit("system-resume", ());
                }
            } else {
                tracing::debug!("System resume event ({event_type:#x}) debounced");
            }
        }
    }

    if msg == WM_NCDESTROY {
        RemoveWindowSubclass(hwnd, Some(power_subclass_proc), uid);
    }

    DefSubclassProc(hwnd, msg, wparam, lparam)
}

pub fn setup_power_events(window: &WebviewWindow) {
    if let Ok(raw_hwnd) = window.hwnd() {
        let _ = APP_HANDLE.set(window.app_handle().clone());
        let hwnd = raw_hwnd.0 as HWND;
        let success = unsafe {
            SetWindowSubclass(
                hwnd,
                Some(power_subclass_proc),
                POWER_EVENTS_SUBCLASS_ID,
                0,
            )
        };
        if success == 0 {
            tracing::error!("SetWindowSubclass failed for power events subclassing");
        }
    } else {
        tracing::error!("Failed to obtain HWND for power events subclassing");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    #[test]
    fn test_should_emit_resume_first_event() {
        let mut last_resume = None;
        let now = Instant::now();
        let debounce = Duration::from_secs(2);

        assert!(should_emit_resume(&mut last_resume, now, debounce));
        assert_eq!(last_resume, Some(now));
    }

    #[test]
    fn test_should_emit_resume_debounces_rapid_subsequent_events() {
        let mut last_resume = None;
        let t0 = Instant::now();
        let debounce = Duration::from_secs(2);

        // First event (e.g. PBT_APMRESUMEAUTOMATIC)
        assert!(should_emit_resume(&mut last_resume, t0, debounce));

        // Rapid follow-up event 50ms later (e.g. PBT_APMRESUMESTANDBY)
        let t1 = t0 + Duration::from_millis(50);
        assert!(!should_emit_resume(&mut last_resume, t1, debounce));

        // Another follow-up event 1500ms later
        let t2 = t0 + Duration::from_millis(1500);
        assert!(!should_emit_resume(&mut last_resume, t2, debounce));

        // Event after debounce window expires (2100ms later)
        let t3 = t0 + Duration::from_millis(2100);
        assert!(should_emit_resume(&mut last_resume, t3, debounce));
        assert_eq!(last_resume, Some(t3));
    }
}
