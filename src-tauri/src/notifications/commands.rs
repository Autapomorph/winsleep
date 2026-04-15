use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::System::Diagnostics::Debug::MessageBeep;
use windows_sys::Win32::UI::WindowsAndMessaging::MB_ICONASTERISK;

#[tauri::command]
pub fn play_notification_sound() -> Result<(), String> {
    let res = unsafe { MessageBeep(MB_ICONASTERISK) };
    if res == 0 {
        let error_code = unsafe { GetLastError() };
        return Err(format!(
            "Failed to play system sound. Error code: {error_code}"
        ));
    }

    Ok(())
}
