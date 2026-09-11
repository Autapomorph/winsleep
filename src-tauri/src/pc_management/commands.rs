use std::process::Command;
use tauri::State;
use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::System::Power::SetSuspendState;
use windows_sys::Win32::System::Shutdown::LockWorkStation;

use crate::pc_management::KeepAwakeManager;

#[tauri::command]
pub fn set_keep_awake(
    state: State<'_, KeepAwakeManager>,
    is_enabled: bool,
    keep_display_awake: Option<bool>,
) -> Result<(), String> {
    if is_enabled {
        state.acquire(
            keep_display_awake.unwrap_or(false),
            "WinSleep: Active timer running",
        )
    } else {
        state.release()
    }
}

#[tauri::command]
pub fn get_keep_awake_status(state: State<'_, KeepAwakeManager>) -> Result<bool, String> {
    Ok(state.is_active())
}

#[tauri::command]
pub fn pc_sleep(keep_awake: State<'_, KeepAwakeManager>) -> Result<(), String> {
    let _ = keep_awake.release();

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
pub fn pc_hibernate(keep_awake: State<'_, KeepAwakeManager>) -> Result<(), String> {
    let _ = keep_awake.release();

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
pub fn pc_shutdown(
    keep_awake: State<'_, KeepAwakeManager>,
    is_force: Option<bool>,
) -> Result<(), String> {
    let _ = keep_awake.release();

    let mut cmd = Command::new("shutdown");
    cmd.args(["/s", "/t", "0"]);

    if is_force.unwrap_or(false) {
        cmd.arg("/f");
    }

    let status = cmd
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
pub fn pc_reboot(
    keep_awake: State<'_, KeepAwakeManager>,
    is_force: Option<bool>,
) -> Result<(), String> {
    let _ = keep_awake.release();

    let mut cmd = Command::new("shutdown");
    cmd.args(["/r", "/t", "0"]);

    if is_force.unwrap_or(false) {
        cmd.arg("/f");
    }

    let status = cmd
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
pub fn pc_signout(is_force: Option<bool>) -> Result<(), String> {
    let mut cmd = Command::new("shutdown");
    cmd.arg("/l");

    if is_force.unwrap_or(false) {
        cmd.arg("/f");
    }

    let status = cmd
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

