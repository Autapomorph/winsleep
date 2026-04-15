use crate::settings::AppSettings;
use crate::tray::{TimerAction, TrayMenuItems, TrayMenuState};
use std::sync::atomic::Ordering;
use std::sync::OnceLock;
use tauri::Emitter;

static DEFAULT_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static RUNNING_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static EXPIRING_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();
static PAUSED_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();

static DEFAULT_HAS_UPDATE_ICON: OnceLock<tauri::image::Image<'static>> = OnceLock::new();

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum IconKind {
    Default,
    Running,
    Expiring,
    Paused,
    DefaultHasUpdate,
}

static LAST_ICON_KIND: std::sync::Mutex<Option<IconKind>> = std::sync::Mutex::new(None);

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
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PresetArgs {
    pub seconds: u32,
    pub label: String,
}

#[tauri::command]
pub fn update_tray_menu(
    app_handle: tauri::AppHandle,
    menu_state: tauri::State<'_, TrayMenuState>,
    tooltip: String,
    open_label: String,
    quit_label: String,
    timer_state: String,
    timer_mode: String,
    is_expiring: bool,
    timer_action: TimerActionMenuArgs,
    timer_status_label: String,
    start_resume_pause_timer_label: String,
    cancel_timer_label: String,
    timer_increase_label: String,
    timer_decrease_label: String,
    presets_label: String,
    is_settings_locked: bool,
    timer_presets: Vec<PresetArgs>,
    lock_settings_label: String,
    update_label: String,
    update_status: String,
) -> Result<(), String> {
    if let Some(open_item_kind) = menu_state.0.get(TrayMenuItems::Open.as_str()) {
        if let Some(open_item) = open_item_kind.as_menuitem() {
            open_item.set_text(&open_label).map_err(|e| e.to_string())?;
        }
    }

    if let Some(status_item_kind) = menu_state.0.get(TrayMenuItems::TimerStatus.as_str()) {
        if let Some(status_item) = status_item_kind.as_menuitem() {
            status_item
                .set_text(&timer_status_label)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(increase_item_kind) = menu_state.0.get(TrayMenuItems::TimerIncrease.as_str()) {
        if let Some(increase_item) = increase_item_kind.as_menuitem() {
            increase_item
                .set_text(&timer_increase_label)
                .map_err(|e| e.to_string())?;
            increase_item
                .set_enabled(!is_settings_locked)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(decrease_item_kind) = menu_state.0.get(TrayMenuItems::TimerDecrease.as_str()) {
        if let Some(decrease_item) = decrease_item_kind.as_menuitem() {
            decrease_item
                .set_text(&timer_decrease_label)
                .map_err(|e| e.to_string())?;
            decrease_item
                .set_enabled(!is_settings_locked)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(lock_toggle_item_kind) =
        menu_state.0.get(TrayMenuItems::SettingsLockToggle.as_str())
    {
        if let Some(lock_toggle_item) = lock_toggle_item_kind.as_menuitem() {
            lock_toggle_item
                .set_text(&lock_settings_label)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(update_item_kind) = menu_state.0.get(TrayMenuItems::Update.as_str()) {
        if let Some(update_item) = update_item_kind.as_menuitem() {
            update_item
                .set_text(&update_label)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(quit_item_kind) = menu_state.0.get(TrayMenuItems::Quit.as_str()) {
        if let Some(quit_item) = quit_item_kind.as_menuitem() {
            quit_item.set_text(&quit_label).map_err(|e| e.to_string())?;
        }
    }

    if let Some(start_item_kind) = menu_state
        .0
        .get(TrayMenuItems::TimerStartResumePause.as_str())
    {
        if let Some(start_item) = start_item_kind.as_menuitem() {
            start_item
                .set_text(&start_resume_pause_timer_label)
                .map_err(|e| e.to_string())?;
            start_item.set_enabled(true).map_err(|e| e.to_string())?;
        }
    }

    if let Some(cancel_item_kind) = menu_state.0.get(TrayMenuItems::TimerCancel.as_str()) {
        if let Some(cancel_item) = cancel_item_kind.as_menuitem() {
            cancel_item
                .set_text(&cancel_timer_label)
                .map_err(|e| e.to_string())?;
            let is_enabled = timer_state == "running" || timer_state == "paused";
            cancel_item
                .set_enabled(is_enabled)
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(presets_submenu_kind) = menu_state.0.get(TrayMenuItems::TimerPresets.as_str()) {
        if let Some(presets_submenu) = presets_submenu_kind.as_submenu() {
            presets_submenu
                .set_text(&presets_label)
                .map_err(|e| e.to_string())?;
            presets_submenu
                .set_enabled(!is_settings_locked)
                .map_err(|e| e.to_string())?;
            if let Ok(items) = presets_submenu.items() {
                for item in items {
                    let _ = presets_submenu.remove(&item);
                }
            }
            for preset in &timer_presets {
                let id = format!("preset_{}", preset.seconds);
                let item = tauri::menu::MenuItemBuilder::with_id(&id, &preset.label)
                    .build(&app_handle)
                    .map_err(|e| e.to_string())?;
                presets_submenu.append(&item).map_err(|e| e.to_string())?;
            }
        }
    }

    if let Some(submenu_kind) = menu_state
        .0
        .get(TrayMenuItems::TimerAction(TimerAction::SelectedTimerAction).as_str())
    {
        if let Some(submenu) = submenu_kind.as_submenu() {
            submenu
                .set_text(&timer_action.selected_timer_action_label)
                .map_err(|e| e.to_string())?;
            submenu
                .set_enabled(!is_settings_locked)
                .map_err(|e| e.to_string())?;
        }
    }

    let actions = [
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionSleep).as_str(),
            timer_action.sleep_label.clone(),
            "sleep",
        ),
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionHibernate).as_str(),
            timer_action.hibernate_label.clone(),
            "hibernate",
        ),
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionShutdown).as_str(),
            timer_action.shutdown_label.clone(),
            "shutdown",
        ),
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionReboot).as_str(),
            timer_action.reboot_label.clone(),
            "reboot",
        ),
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionLock).as_str(),
            timer_action.lock_label.clone(),
            "lock",
        ),
        (
            TrayMenuItems::TimerAction(TimerAction::SelectTimerActionSignout).as_str(),
            timer_action.signout_label.clone(),
            "signout",
        ),
    ];

    if let Some(submenu_kind) = menu_state
        .0
        .get(TrayMenuItems::TimerAction(TimerAction::SelectedTimerAction).as_str())
    {
        if let Some(submenu) = submenu_kind.as_submenu() {
            for (item_id, label, action_name) in actions {
                if let Some(item_kind) = submenu.get(item_id) {
                    if let Some(check_item) = item_kind.as_check_menuitem() {
                        check_item
                            .set_text(label)
                            .map_err(|e: tauri::Error| e.to_string())?;
                        check_item
                            .set_checked(timer_action.selected_timer_action == action_name)
                            .map_err(|e: tauri::Error| e.to_string())?;
                    }
                }
            }
        }
    }

    // Load the custom tray icons from the static cache
    let default_icon = get_default_icon();
    let running_icon = get_running_icon();
    let expiring_icon = get_expiring_icon();
    let paused_icon = get_paused_icon();

    let default_has_update_icon = get_default_has_update_icon();

    // Swap the tray icon dynamically
    if let Some(tray) = app_handle.tray_by_id("main") {
        let icon_kind = if timer_state == "idle" && update_status == "readyToRestart" {
            IconKind::DefaultHasUpdate
        } else {
            match timer_state.as_str() {
                "idle" => IconKind::Default,
                "paused" => IconKind::Paused,
                "running" => {
                    if is_expiring {
                        IconKind::Expiring
                    } else {
                        IconKind::Running
                    }
                }
                _ => IconKind::Default,
            }
        };

        let mut last_icon = LAST_ICON_KIND.lock().unwrap();
        let should_set_icon = last_icon.map_or(true, |last| last != icon_kind);

        if should_set_icon {
            let icon = match icon_kind {
                IconKind::Default => default_icon,
                IconKind::Running => running_icon,
                IconKind::Expiring => expiring_icon,
                IconKind::Paused => paused_icon,
                IconKind::DefaultHasUpdate => default_has_update_icon,
            };
            tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
            *last_icon = Some(icon_kind);
        }

        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;
    }

    // Emit the state to the frontend tray window
    #[derive(serde::Serialize, Clone)]
    #[serde(rename_all = "camelCase")]
    struct TrayStatePayload<'a> {
        tooltip: &'a str,
        open_label: &'a str,
        quit_label: &'a str,
        timer_state: &'a str,
        timer_mode: &'a str,
        is_expiring: bool,
        timer_action: &'a TimerActionMenuArgs,
        timer_status_label: &'a str,
        start_resume_pause_timer_label: &'a str,
        cancel_timer_label: &'a str,
        timer_increase_label: &'a str,
        timer_decrease_label: &'a str,
        presets_label: &'a str,
        is_settings_locked: bool,
        timer_presets: &'a [PresetArgs],
        lock_settings_label: &'a str,
        update_label: &'a str,
        update_status: &'a str,
    }

    let payload = TrayStatePayload {
        tooltip: &tooltip,
        open_label: &open_label,
        quit_label: &quit_label,
        timer_state: &timer_state,
        timer_mode: &timer_mode,
        is_expiring,
        timer_action: &timer_action,
        timer_status_label: &timer_status_label,
        start_resume_pause_timer_label: &start_resume_pause_timer_label,
        cancel_timer_label: &cancel_timer_label,
        timer_increase_label: &timer_increase_label,
        timer_decrease_label: &timer_decrease_label,
        presets_label: &presets_label,
        is_settings_locked,
        timer_presets: &timer_presets,
        lock_settings_label: &lock_settings_label,
        update_label: &update_label,
        update_status: &update_status,
    };

    let _ = app_handle.emit("tray-state-updated", payload);

    Ok(())
}
