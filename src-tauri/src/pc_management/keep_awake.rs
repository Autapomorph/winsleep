use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::sync::Mutex;
use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, HANDLE, INVALID_HANDLE_VALUE};
use windows_sys::Win32::System::Power::{
    PowerClearRequest, PowerCreateRequest, PowerRequestDisplayRequired, PowerRequestSystemRequired,
    PowerSetRequest,
};
use windows_sys::Win32::System::Threading::{
    POWER_REQUEST_CONTEXT_SIMPLE_STRING, REASON_CONTEXT, REASON_CONTEXT_0,
};

struct SafeHandle(HANDLE);
unsafe impl Send for SafeHandle {}
unsafe impl Sync for SafeHandle {}

struct ActiveKeepAwake {
    handle: SafeHandle,
    display_required: bool,
}

pub struct KeepAwakeManager {
    inner: Mutex<Option<ActiveKeepAwake>>,
}

impl Default for KeepAwakeManager {
    fn default() -> Self {
        Self {
            inner: Mutex::new(None),
        }
    }
}

impl KeepAwakeManager {
    pub fn acquire(&self, prevent_display_sleep: bool, reason: &str) -> Result<(), String> {
        let mut guard = self
            .inner
            .lock()
            .map_err(|e| format!("Failed to lock KeepAwakeManager: {e}"))?;

        // If already active with the exact same display setting, nothing more to do
        if let Some(active) = guard.as_ref() {
            if active.display_required == prevent_display_sleep {
                return Ok(());
            }
        }

        // Release any existing request before creating a new one
        if let Some(active) = guard.take() {
            unsafe {
                let _ = PowerClearRequest(active.handle.0, PowerRequestSystemRequired);
                if active.display_required {
                    let _ = PowerClearRequest(active.handle.0, PowerRequestDisplayRequired);
                }
                let _ = CloseHandle(active.handle.0);
            }
        }

        let wide_reason: Vec<u16> = OsStr::new(reason)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        let context = REASON_CONTEXT {
            Version: 0,
            Flags: POWER_REQUEST_CONTEXT_SIMPLE_STRING,
            Reason: REASON_CONTEXT_0 {
                SimpleReasonString: wide_reason.as_ptr() as *mut u16,
            },
        };

        let handle = unsafe { PowerCreateRequest(&context) };
        if handle.is_null() || handle == INVALID_HANDLE_VALUE {
            let err = unsafe { GetLastError() };
            return Err(format!(
                "PowerCreateRequest failed with Windows error code: {err}"
            ));
        }

        let res_sys = unsafe { PowerSetRequest(handle, PowerRequestSystemRequired) };
        if res_sys == 0 {
            let err = unsafe { GetLastError() };
            unsafe { CloseHandle(handle) };
            return Err(format!(
                "PowerSetRequest(SystemRequired) failed with Windows error code: {err}"
            ));
        }

        if prevent_display_sleep {
            let res_disp = unsafe { PowerSetRequest(handle, PowerRequestDisplayRequired) };
            if res_disp == 0 {
                let err = unsafe { GetLastError() };
                tracing::warn!(
                    "PowerSetRequest(DisplayRequired) failed with code {err}, continuing with system sleep prevention only"
                );
            }
        }

        tracing::info!(
            "Acquired Windows Power Availability Request (prevent_display_sleep: {})",
            prevent_display_sleep
        );

        *guard = Some(ActiveKeepAwake {
            handle: SafeHandle(handle),
            display_required: prevent_display_sleep,
        });

        Ok(())
    }

    pub fn release(&self) -> Result<(), String> {
        let mut guard = self
            .inner
            .lock()
            .map_err(|e| format!("Failed to lock KeepAwakeManager: {e}"))?;

        if let Some(active) = guard.take() {
            unsafe {
                let _ = PowerClearRequest(active.handle.0, PowerRequestSystemRequired);
                if active.display_required {
                    let _ = PowerClearRequest(active.handle.0, PowerRequestDisplayRequired);
                }
                let _ = CloseHandle(active.handle.0);
            }
            tracing::info!("Released Windows Power Availability Request");
        }

        Ok(())
    }

    pub fn is_active(&self) -> bool {
        self.inner
            .lock()
            .map(|guard| guard.is_some())
            .unwrap_or(false)
    }
}

impl Drop for KeepAwakeManager {
    fn drop(&mut self) {
        let _ = self.release();
    }
}
