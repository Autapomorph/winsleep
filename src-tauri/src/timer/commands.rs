use crate::timer::state::ManagedTimer;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn start_timer(
    app_handle: AppHandle,
    state: State<'_, ManagedTimer>,
    duration_ms: u64,
    target_timestamp_ms: Option<i64>,
) -> Result<(), String> {
    tracing::info!("start_timer called: duration_ms={}, target_timestamp_ms={:?}", duration_ms, target_timestamp_ms);
    let (tx, mut rx) = tokio::sync::oneshot::channel::<()>();

    if let Ok(mut timer) = state.lock() {
        if let Some(old_tx) = timer.cancel_tx.take() {
            tracing::info!("Cancelling older running timer");
            let _ = old_tx.send(());
        }
        timer.cancel_tx = Some(tx);
    }

    tokio::spawn(async move {
        tracing::info!("Backend timer thread spawned successfully");
        let mut interval = tokio::time::interval(Duration::from_millis(250));

        let start_instant = Instant::now();
        let target_instant = start_instant + Duration::from_millis(duration_ms);

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    let now_ms = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis() as i64;

                    let remaining = if let Some(target_ms) = target_timestamp_ms {
                        if now_ms >= target_ms {
                            tracing::info!("Target timestamp reached. Emitting timer-complete");
                            let _ = app_handle.emit("timer-complete", ());
                            break;
                        }
                        ((target_ms - now_ms) as f64 / 1000.0).max(0.0).ceil() as u64
                    } else {
                        let now_instant = Instant::now();
                        if now_instant >= target_instant {
                            tracing::info!("Target instant reached. Emitting timer-complete");
                            let _ = app_handle.emit("timer-complete", ());
                            break;
                        }
                        target_instant.duration_since(now_instant).as_secs_f64().ceil() as u64
                    };

                    // tracing::debug!("Ticking. Remaining: {}s", remaining);
                    let _ = app_handle.emit("timer-tick", remaining);
                }
                _ = &mut rx => {
                    tracing::info!("Timer loop received cancel signal, exiting");
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_timer(state: State<'_, ManagedTimer>) -> Result<(), String> {
    tracing::info!("cancel_timer called");
    if let Ok(mut timer) = state.lock() {
        if let Some(tx) = timer.cancel_tx.take() {
            let _ = tx.send(());
        }
    }
    Ok(())
}
