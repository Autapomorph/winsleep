use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows_sys::Win32::UI::WindowsAndMessaging::{WM_NCDESTROY, WM_POWERBROADCAST};

const PBT_APMRESUMEAUTOMATIC: usize = 0x0012;
const PBT_APMRESUMESTANDBY: usize = 0x000F;

const POWER_EVENTS_SUBCLASS_ID: usize = 1;

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

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
        if event_type == PBT_APMRESUMEAUTOMATIC || event_type == PBT_APMRESUMESTANDBY {
            if let Some(app) = APP_HANDLE.get() {
                let _ = app.emit("system-resume", ());
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
