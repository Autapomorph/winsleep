use std::process::Command;
use tauri::State;
use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::System::Power::SetSuspendState;
use windows_sys::Win32::System::Shutdown::{
    ExitWindowsEx, LockWorkStation, EWX_FORCE, EWX_LOGOFF,
};

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

pub fn get_shutdown_exe_path() -> std::path::PathBuf {
    let sys_root = std::env::var_os("SystemRoot")
        .or_else(|| std::env::var_os("windir"))
        .unwrap_or_else(|| "C:\\Windows".into());
    std::path::Path::new(&sys_root).join("System32").join("shutdown.exe")
}

fn create_shutdown_command() -> Command {
    let shutdown_path = get_shutdown_exe_path();
    let mut cmd = Command::new(shutdown_path);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

#[tauri::command]
pub fn pc_shutdown(
    keep_awake: State<'_, KeepAwakeManager>,
    is_force: Option<bool>,
) -> Result<(), String> {
    let _ = keep_awake.release();

    let mut cmd = create_shutdown_command();
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

    let mut cmd = create_shutdown_command();
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
pub fn pc_lock(keep_awake: State<'_, KeepAwakeManager>) -> Result<(), String> {
    let _ = keep_awake.release();

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
pub fn pc_signout(
    keep_awake: State<'_, KeepAwakeManager>,
    is_force: Option<bool>,
) -> Result<(), String> {
    let _ = keep_awake.release();

    let mut flags = EWX_LOGOFF;
    if is_force.unwrap_or(false) {
        flags |= EWX_FORCE;
    }

    let res = unsafe { ExitWindowsEx(flags, 0) };
    if res == 0 {
        let error_code = unsafe { GetLastError() };
        return Err(format!(
            "Failed to initiate user logoff. Error code: {error_code}"
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_shutdown_exe_path() {
        let path = get_shutdown_exe_path();
        assert!(path.ends_with(std::path::Path::new("System32").join("shutdown.exe")));
        assert!(path.is_absolute());
    }
}


