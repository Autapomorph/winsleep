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
                            let monitor = app
                                .available_monitors()
                                .ok()
                                .and_then(|monitors| {
                                    monitors.into_iter().find(|m| {
                                        is_point_inside_monitor(
                                            &rect.position,
                                            *m.position(),
                                            *m.size(),
                                            m.scale_factor(),
                                        )
                                    })
                                })
                                .or_else(|| app.primary_monitor().ok().flatten())
                                .or_else(|| window.current_monitor().ok().flatten());

                            let scale_factor =
                                monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);

                            let fallback_width = (320.0 * scale_factor) as u32;
                            let fallback_height = (480.0 * scale_factor) as u32;

                            let size = window
                                .outer_size()
                                .or_else(|_| window.inner_size())
                                .unwrap_or_else(|_| {
                                    tauri::PhysicalSize::new(fallback_width, fallback_height)
                                });

                            let win_width = if size.width > 0 {
                                size.width as f64
                            } else {
                                fallback_width as f64
                            };
                            let win_height = if size.height > 0 {
                                size.height as f64
                            } else {
                                fallback_height as f64
                            };

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

pub fn is_point_inside_monitor(
    pos: &tauri::Position,
    monitor_pos: tauri::PhysicalPosition<i32>,
    monitor_size: tauri::PhysicalSize<u32>,
    scale_factor: f64,
) -> bool {
    let (px, py) = match *pos {
        tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
        tauri::Position::Logical(l) => (l.x * scale_factor, l.y * scale_factor),
    };

    let min_x = monitor_pos.x as f64;
    let max_x = min_x + monitor_size.width as f64;
    let min_y = monitor_pos.y as f64;
    let max_y = min_y + monitor_size.height as f64;

    px >= min_x && px < max_x && py >= min_y && py < max_y
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_point_inside_monitor_physical_coords() {
        let monitor_pos = tauri::PhysicalPosition::new(0, 0);
        let monitor_size = tauri::PhysicalSize::new(1920, 1080);
        let scale_factor = 1.0;

        let inside = tauri::Position::Physical(tauri::PhysicalPosition::new(500, 500));
        assert!(is_point_inside_monitor(&inside, monitor_pos, monitor_size, scale_factor));

        let outside_x = tauri::Position::Physical(tauri::PhysicalPosition::new(2000, 500));
        assert!(!is_point_inside_monitor(&outside_x, monitor_pos, monitor_size, scale_factor));

        let outside_y = tauri::Position::Physical(tauri::PhysicalPosition::new(500, 1200));
        assert!(!is_point_inside_monitor(&outside_y, monitor_pos, monitor_size, scale_factor));
    }

    #[test]
    fn test_is_point_inside_monitor_logical_coords_with_scaling() {
        let monitor_pos = tauri::PhysicalPosition::new(0, 0);
        let monitor_size = tauri::PhysicalSize::new(3840, 2160); // 4K physical
        let scale_factor = 2.0; // 200% scaling -> 1920x1080 logical

        // Logical (1000, 500) * 2.0 = Physical (2000, 1000) -> inside 3840x2160
        let inside = tauri::Position::Logical(tauri::LogicalPosition::new(1000.0, 500.0));
        assert!(is_point_inside_monitor(&inside, monitor_pos, monitor_size, scale_factor));

        // Logical (2000, 500) * 2.0 = Physical (4000, 1000) -> outside 3840x2160
        let outside = tauri::Position::Logical(tauri::LogicalPosition::new(2000.0, 500.0));
        assert!(!is_point_inside_monitor(&outside, monitor_pos, monitor_size, scale_factor));
    }

    #[test]
    fn test_is_point_inside_monitor_secondary_monitor_offset() {
        // Second monitor placed to the right of the primary: x starts at 1920, 150% scaling
        let monitor_pos = tauri::PhysicalPosition::new(1920, 0);
        let monitor_size = tauri::PhysicalSize::new(2560, 1440);
        let scale_factor = 1.5;

        // Physical coordinates on secondary monitor
        let inside_physical = tauri::Position::Physical(tauri::PhysicalPosition::new(2500, 700));
        assert!(is_point_inside_monitor(&inside_physical, monitor_pos, monitor_size, scale_factor));

        let on_primary = tauri::Position::Physical(tauri::PhysicalPosition::new(1000, 500));
        assert!(!is_point_inside_monitor(&on_primary, monitor_pos, monitor_size, scale_factor));

        // Logical coordinates: (2000.0, 500.0) * 1.5 = (3000.0, 750.0) -> inside [1920..4480, 0..1440]
        let inside_logical = tauri::Position::Logical(tauri::LogicalPosition::new(2000.0, 500.0));
        assert!(is_point_inside_monitor(&inside_logical, monitor_pos, monitor_size, scale_factor));
    }
}
