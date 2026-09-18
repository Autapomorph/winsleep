use crate::settings::AppSettings;
use std::sync::atomic::Ordering;
use std::sync::OnceLock;
use tauri::Emitter;

static DEFAULT_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static RUNNING_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static EXPIRING_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static PAUSED_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();

static DEFAULT_HAS_UPDATE_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IconKind {
    Default,
    Running,
    Expiring,
    Paused,
    DefaultHasUpdate,
}

#[derive(Default)]
pub struct TrayState {
    pub last_icon_kind: std::sync::Mutex<Option<IconKind>>,
    pub last_tooltip: std::sync::Mutex<Option<String>>,
}

fn get_default_icon() -> tauri::image::Image<'static> {
    DEFAULT_ICON
        .get_or_init(|| {
            tauri::image::Image::from_bytes(include_bytes!("../../icons/icon.ico"))
                .expect("Failed to load default icon")
        })
        .clone()
}

fn get_running_icon() -> tauri::image::Image<'static> {
    RUNNING_ICON
        .get_or_init(|| {
            tauri::image::Image::from_bytes(include_bytes!(
                "../../icons/tray_icon_timer_running.ico"
            ))
            .expect("Failed to load running icon")
        })
        .clone()
}

fn get_expiring_icon() -> tauri::image::Image<'static> {
    EXPIRING_ICON
        .get_or_init(|| {
            tauri::image::Image::from_bytes(include_bytes!(
                "../../icons/tray_icon_timer_expiring.ico"
            ))
            .expect("Failed to load expiring icon")
        })
        .clone()
}

fn get_paused_icon() -> tauri::image::Image<'static> {
    PAUSED_ICON
        .get_or_init(|| {
            tauri::image::Image::from_bytes(include_bytes!(
                "../../icons/tray_icon_timer_paused.ico"
            ))
            .expect("Failed to load paused icon")
        })
        .clone()
}

fn get_default_has_update_icon() -> tauri::image::Image<'static> {
    DEFAULT_HAS_UPDATE_ICON
        .get_or_init(|| {
            tauri::image::Image::from_bytes(include_bytes!("../../icons/icon_has_update.ico"))
                .expect("Failed to load default update icon")
        })
        .clone()
}

#[tauri::command]
pub fn set_is_tray_mode_enabled(state: tauri::State<'_, AppSettings>, is_enabled: bool) {
    state
        .is_tray_mode_enabled
        .store(is_enabled, Ordering::Relaxed);
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TimerActionMenuArgs {
    pub selected_timer_action_label: String,
    pub selected_timer_action: String,
    pub sleep_label: String,
    pub hibernate_label: String,
    pub shutdown_label: String,
    pub reboot_label: String,
    pub lock_label: String,
    pub signout_label: String,
    pub keep_awake_label: String,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PresetArgs {
    pub seconds: u32,
    pub label: String,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTrayMenuPayload {
    pub tooltip: String,
    pub open_label: String,
    pub quit_label: String,
    pub timer_state: String,
    pub timer_mode: String,
    pub is_expiring: bool,
    pub timer_action: TimerActionMenuArgs,
    pub timer_status_label: String,
    pub start_resume_pause_timer_label: String,
    pub cancel_timer_label: String,
    pub timer_increase_label: String,
    pub timer_decrease_label: String,
    pub presets_label: String,
    pub is_settings_locked: bool,
    pub timer_presets: Vec<PresetArgs>,
    pub lock_settings_label: String,
    pub update_label: String,
    pub update_status: String,
}

#[tauri::command]
pub fn update_tray_menu(
    app_handle: tauri::AppHandle,
    tray_state: tauri::State<'_, TrayState>,
    payload: UpdateTrayMenuPayload,
) -> Result<(), String> {
    // Swap the tray icon dynamically
    if let Some(tray) = app_handle.tray_by_id("main") {
        let icon_kind =
            if payload.timer_state == "idle" && payload.update_status == "readyToInstall" {
                IconKind::DefaultHasUpdate
            } else {
                match payload.timer_state.as_str() {
                    "idle" => IconKind::Default,
                    "paused" => IconKind::Paused,
                    "running" => {
                        if payload.is_expiring {
                            IconKind::Expiring
                        } else {
                            IconKind::Running
                        }
                    }
                    _ => IconKind::Default,
                }
            };

        let mut last_icon = tray_state
            .last_icon_kind
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        let should_set_icon = last_icon.is_none_or(|last| last != icon_kind);

        if should_set_icon {
            let icon = match icon_kind {
                IconKind::Default => get_default_icon(),
                IconKind::Running => get_running_icon(),
                IconKind::Expiring => get_expiring_icon(),
                IconKind::Paused => get_paused_icon(),
                IconKind::DefaultHasUpdate => get_default_has_update_icon(),
            };
            tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
            *last_icon = Some(icon_kind);
        }

        let mut last_tooltip = tray_state
            .last_tooltip
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        let should_set_tooltip = last_tooltip.as_deref() != Some(&payload.tooltip);
        if should_set_tooltip {
            tray.set_tooltip(Some(&payload.tooltip))
                .map_err(|e| e.to_string())?;
            *last_tooltip = Some(payload.tooltip.clone());
        }
    } else {
        tracing::warn!("Tray icon with id 'main' not found during update_tray_menu");
    }

    // Emit the state to the frontend tray window
    let _ = app_handle.emit("tray-state-updated", &payload);

    Ok(())
}
