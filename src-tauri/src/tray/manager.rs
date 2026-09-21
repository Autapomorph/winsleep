use tauri::Manager;

pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::tray::TrayIconBuilder;
    use tauri::Emitter;

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
                        let is_focused = window.is_focused().unwrap_or(false);

                        if is_visible && !is_minimized && is_focused {
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
                            let _ = window.emit("tray-menu-close-request", ());
                        } else {
                            // Position the window on the monitor where the tray icon was clicked
                            let (click_x, click_y) = match rect.position {
                                tauri::Position::Physical(p) => (p.x, p.y),
                                tauri::Position::Logical(l) => (l.x as i32, l.y as i32),
                            };

                            let monitor = app
                                .available_monitors()
                                .ok()
                                .and_then(|monitors| {
                                    monitors.into_iter().find(|m| {
                                        let pos = m.position();
                                        let size = m.size();
                                        click_x >= pos.x
                                            && click_x < pos.x + size.width as i32
                                            && click_y >= pos.y
                                            && click_y < pos.y + size.height as i32
                                    })
                                })
                                .or_else(|| app.primary_monitor().ok().flatten())
                                .or_else(|| window.current_monitor().ok().flatten());

                            let scale_factor =
                                monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);

                            let size = window
                                .outer_size()
                                .or_else(|_| window.inner_size())
                                .unwrap_or_else(|_| {
                                    tauri::PhysicalSize::new(
                                        (320.0 * scale_factor) as u32,
                                        (480.0 * scale_factor) as u32,
                                    )
                                });
                            let win_width = size.width as f64;
                            let win_height = size.height as f64;

                            let (pos_x, pos_y) = match rect.position {
                                tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                                tauri::Position::Logical(l) => (l.x * scale_factor, l.y * scale_factor),
                            };
                            let (width, height) = match rect.size {
                                tauri::Size::Physical(s) => (s.width as f64, s.height as f64),
                                tauri::Size::Logical(l) => (l.width * scale_factor, l.height * scale_factor),
                            };

                            let icon_center_x = pos_x + (width / 2.0);
                            let icon_top_y = pos_y;
                            let icon_bottom_y = pos_y + height;

                            let monitor_pos = monitor
                                .as_ref()
                                .map(|m| m.position())
                                .cloned()
                                .unwrap_or_else(|| tauri::PhysicalPosition::new(0, 0));

                            let monitor_size = monitor
                                .as_ref()
                                .map(|m| m.size())
                                .cloned()
                                .unwrap_or_else(|| tauri::PhysicalSize::new(1920, 1080));

                            let margin = 10.0 * scale_factor;

                            let x = (icon_center_x - (win_width / 2.0)) as i32;
                            let min_x = (monitor_pos.x as f64 + margin) as i32;
                            let max_x = (monitor_pos.x as f64 + monitor_size.width as f64 - win_width - margin) as i32;
                            let max_x = max_x.max(min_x);
                            let x = x.clamp(min_x, max_x);

                            let monitor_mid_y = monitor_pos.y as f64 + (monitor_size.height as f64 / 2.0);
                            let y = if icon_top_y > monitor_mid_y {
                                // Taskbar is in the bottom half, place above the tray icon
                                (icon_top_y - win_height - margin) as i32
                            } else {
                                // Taskbar is in the top half, place below the tray icon
                                (icon_bottom_y + margin) as i32
                            };
                            let min_y = (monitor_pos.y as f64 + margin) as i32;
                            let max_y = (monitor_pos.y as f64 + monitor_size.height as f64 - win_height - margin) as i32;
                            let max_y = max_y.max(min_y);
                            let y = y.clamp(min_y, max_y);

                            let _ = window.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition::new(x, y),
                            ));
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("tray-sync-request", ());
                            let _ = window.emit("tray-menu-show", ());
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
