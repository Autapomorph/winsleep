use tauri::{Emitter, WebviewWindow};
use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
use windows_sys::Win32::UI::WindowsAndMessaging::{WM_NCDESTROY, WM_POWERBROADCAST};

const PBT_APMRESUMEAUTOMATIC: usize = 0x0012;
const PBT_APMRESUMESTANDBY: usize = 0x000F;

unsafe extern "system" fn power_subclass_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _uid: usize,
    ref_data: usize,
) -> LRESULT {
    if msg == WM_POWERBROADCAST {
        let event_type = wparam;
        if event_type == PBT_APMRESUMEAUTOMATIC || event_type == PBT_APMRESUMESTANDBY {
            // Retrieve the WebviewWindow instance from ref_data pointer
            let window_ptr = ref_data as *const WebviewWindow;
            let window = &*window_ptr;

            // Emit the event to the frontend
            let _ = window.emit("system-resume", ());
        }
    }

    if msg == WM_NCDESTROY {
        // Drop the cloned WebviewWindow box to prevent memory leaks
        let ptr = ref_data as *mut WebviewWindow;
        let _ = Box::from_raw(ptr);
    }

    DefSubclassProc(hwnd, msg, wparam, lparam)
}

pub fn setup_power_events(window: &WebviewWindow) {
    let hwnd = window.hwnd().unwrap().0 as HWND;
    let window_box = Box::new(window.clone());
    let ref_data = Box::into_raw(window_box) as usize;
    unsafe {
        SetWindowSubclass(hwnd, Some(power_subclass_proc), 12345, ref_data);
    }
}
