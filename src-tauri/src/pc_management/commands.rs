use std::process::Command;
use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::System::Power::SetSuspendState;
use windows_sys::Win32::System::Shutdown::LockWorkStation;

#[tauri::command]
pub fn pc_sleep() -> Result<(), String> {
    let res = unsafe { SetSuspendState(0, 1, 0) };
    if res == 0 {
        let error_code = unsafe { GetLastError() };
        return Err(format!(
            "Failed to put the system to sleep. Error code: {error_code}"
        ));
    }

    Ok(())
}

#[tauri::command]
pub fn pc_hibernate() -> Result<(), String> {
    let res = unsafe { SetSuspendState(1, 1, 0) };
    if res == 0 {
        let error_code = unsafe { GetLastError() };
        return Err(format!(
            "Failed to put the system to hibernation. Error code: {error_code}"
        ));
    }

    Ok(())
}

#[tauri::command]
pub fn pc_shutdown() -> Result<(), String> {
    let status = Command::new("shutdown")
        .args(["/s", "/t", "0"])
        .status()
        .map_err(|e| format!("Failed to initiate system shutdown process: {e}"))?;

    if !status.success() {
        return Err(format!(
            "Shutdown command exited with an error. Exit code: {:?}",
            status.code()
        ));
    }

    Ok(())
}

#[tauri::command]
pub fn pc_reboot() -> Result<(), String> {
    let status = Command::new("shutdown")
        .args(["/r", "/t", "0"])
        .status()
        .map_err(|e| format!("Failed to initiate system restart process: {e}"))?;

    if !status.success() {
        return Err(format!(
            "Restart command exited with an error. Exit code: {:?}",
            status.code()
        ));
    }

    Ok(())
}

#[tauri::command]
pub fn pc_lock() -> Result<(), String> {
    let res = unsafe { LockWorkStation() };
    if res == 0 {
        let error_code = unsafe { GetLastError() };
        return Err(format!(
            "Failed to lock the workstation. Error code: {error_code}"
        ));
    }

    Ok(())
}

#[tauri::command]
pub fn pc_signout() -> Result<(), String> {
    let status = Command::new("shutdown")
        .args(["/l"])
        .status()
        .map_err(|e| format!("Failed to initiate user logoff process: {e}"))?;

    if !status.success() {
        return Err(format!(
            "Logoff command exited with an error. Exit code: {:?}",
            status.code()
        ));
    }

    Ok(())
}
