use tauri::Manager;

pub struct TrayMenuState(pub tauri::menu::Menu<tauri::Wry>);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TimerAction {
    SelectedTimerAction,
    SelectTimerActionSleep,
    SelectTimerActionHibernate,
    SelectTimerActionShutdown,
    SelectTimerActionReboot,
    SelectTimerActionLock,
    SelectTimerActionSignout,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayMenuItems {
    Open,
    TimerAction(TimerAction),
    TimerStatus,
    TimerStartResumePause,
    TimerCancel,
    TimerPresets,
    TimerIncrease,
    TimerDecrease,
    SettingsLockToggle,
    Update,
    Quit,
}

impl TrayMenuItems {
    pub fn as_str(&self) -> &'static str {
        match self {
            TrayMenuItems::Open => "open",
            TrayMenuItems::Quit => "quit",
            TrayMenuItems::TimerStatus => "timer_status",
            TrayMenuItems::TimerAction(action) => match action {
                TimerAction::SelectedTimerAction => "timer_action_submenu",
                TimerAction::SelectTimerActionSleep => "action_sleep",
                TimerAction::SelectTimerActionHibernate => "action_hibernate",
                TimerAction::SelectTimerActionShutdown => "action_shutdown",
                TimerAction::SelectTimerActionReboot => "action_reboot",
                TimerAction::SelectTimerActionLock => "action_lock",
                TimerAction::SelectTimerActionSignout => "action_signout",
            },
            TrayMenuItems::TimerStartResumePause => "timer_start_resume_pause",
            TrayMenuItems::TimerCancel => "timer_cancel",
            TrayMenuItems::TimerPresets => "timer_presets_submenu",
            TrayMenuItems::TimerIncrease => "timer_increase",
            TrayMenuItems::TimerDecrease => "timer_decrease",
            TrayMenuItems::SettingsLockToggle => "settings_lock_toggle",
            TrayMenuItems::Update => "update",
        }
    }
}

pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
    use tauri::tray::TrayIconBuilder;
    use tauri::Emitter;

    let open_item = MenuItemBuilder::with_id(TrayMenuItems::Open.as_str(), "Open").build(app)?;

    let timer_status =
        MenuItemBuilder::with_id(TrayMenuItems::TimerStatus.as_str(), "Timer not running")
            .enabled(true)
            .build(app)?;

    let action_sleep = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionSleep).as_str(),
        "Sleep",
    )
    .checked(false)
    .build(app)?;

    let action_hibernate = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionHibernate).as_str(),
        "Hibernate",
    )
    .checked(false)
    .build(app)?;

    let action_shutdown = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionShutdown).as_str(),
        "Shutdown",
    )
    .checked(false)
    .build(app)?;

    let action_reboot = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionReboot).as_str(),
        "Restart",
    )
    .checked(false)
    .build(app)?;

    let action_lock = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionLock).as_str(),
        "Screen Lock",
    )
    .checked(false)
    .build(app)?;

    let action_signout = CheckMenuItemBuilder::with_id(
        TrayMenuItems::TimerAction(TimerAction::SelectTimerActionSignout).as_str(),
        "Sign Out",
    )
    .checked(false)
    .build(app)?;

    let timer_action_submenu = SubmenuBuilder::with_id(
        app,
        TrayMenuItems::TimerAction(TimerAction::SelectedTimerAction).as_str(),
        "Action",
    )
    .items(&[
        &action_sleep,
        &action_hibernate,
        &action_shutdown,
        &action_reboot,
        &action_lock,
        &action_signout,
    ])
    .build()?;

    let timer_presets_submenu =
        SubmenuBuilder::with_id(app, TrayMenuItems::TimerPresets.as_str(), "Select Preset")
            .build()?;

    let timer_increase =
        MenuItemBuilder::with_id(TrayMenuItems::TimerIncrease.as_str(), "Increase Timer")
            .enabled(true)
            .build(app)?;

    let timer_decrease =
        MenuItemBuilder::with_id(TrayMenuItems::TimerDecrease.as_str(), "Decrease Timer")
            .enabled(true)
            .build(app)?;

    let timer_start_resume_pause =
        MenuItemBuilder::with_id(TrayMenuItems::TimerStartResumePause.as_str(), "Start Timer")
            .enabled(true)
            .build(app)?;

    let timer_cancel =
        MenuItemBuilder::with_id(TrayMenuItems::TimerCancel.as_str(), "Cancel Timer")
            .enabled(false)
            .build(app)?;

    let settings_lock_toggle =
        MenuItemBuilder::with_id(TrayMenuItems::SettingsLockToggle.as_str(), "Lock Settings")
            .enabled(true)
            .build(app)?;

    let update_item = MenuItemBuilder::with_id(TrayMenuItems::Update.as_str(), "Check for Updates")
        .enabled(true)
        .build(app)?;

    let quit_item = MenuItemBuilder::with_id(TrayMenuItems::Quit.as_str(), "Quit").build(app)?;

    // Build the menu
    let menu = MenuBuilder::new(app)
        .items(&[
            &open_item,
            &timer_action_submenu,
            &timer_presets_submenu,
            &timer_status,
            &timer_start_resume_pause,
            &timer_cancel,
            &timer_increase,
            &timer_decrease,
            &settings_lock_toggle,
            &update_item,
            &quit_item,
        ])
        .build()?;

    // Manage Menu in state so commands can look up items dynamically
    app.manage(TrayMenuState(menu.clone()));

    // Create the tray icon
    let _tray = TrayIconBuilder::with_id("main")
        .icon(
            app.default_window_icon()
                .cloned()
                .ok_or("No default window icon found")?,
        )
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button,
                button_state: tauri::tray::MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();

                if button == tauri::tray::MouseButton::Left {
                    if let Some(window) = app.get_webview_window("main") {
                        let is_visible = window.is_visible().unwrap_or(false);
                        let is_minimized = window.is_minimized().unwrap_or(false);

                        if is_visible && !is_minimized {
                            let _ = window.hide();
                        } else {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                } else if button == tauri::tray::MouseButton::Right {
                    if let Some(window) = app.get_webview_window("tray_menu") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            // Position the window
                            let monitor = window.current_monitor().ok().flatten();
                            let scale_factor =
                                monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);

                            let size = window.inner_size().unwrap_or_else(|_| {
                                tauri::PhysicalSize::new(
                                    (320.0 * scale_factor) as u32,
                                    (480.0 * scale_factor) as u32,
                                )
                            });
                            let win_width = size.width as f64;
                            let win_height = size.height as f64;

                            let (pos_x, pos_y) = match rect.position {
                                tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                                tauri::Position::Logical(l) => (l.x, l.y),
                            };
                            let (width, height) = match rect.size {
                                tauri::Size::Physical(s) => (s.width as f64, s.height as f64),
                                tauri::Size::Logical(l) => (l.width, l.height),
                            };

                            let icon_center_x = pos_x + (width / 2.0);
                            let icon_top_y = pos_y;
                            let icon_bottom_y = pos_y + height;

                            let monitor_size = monitor
                                .as_ref()
                                .map(|m| m.size())
                                .cloned()
                                .unwrap_or_else(|| tauri::PhysicalSize::new(1920, 1080));

                            let x = (icon_center_x - (win_width / 2.0)) as i32;
                            let max_x = (monitor_size.width as f64 - win_width) as i32;
                            let x = x.clamp(0, max_x);

                            let y = if icon_top_y > (monitor_size.height as f64 / 2.0) {
                                // Taskbar is at the bottom, place above the tray icon
                                (icon_top_y - win_height - (8.0 * scale_factor)) as i32
                            } else {
                                // Taskbar is at the top, place below the tray icon
                                (icon_bottom_y + (8.0 * scale_factor)) as i32
                            };

                            let _ = window.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition::new(x, y),
                            ));
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("tray-sync-request", ());
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
