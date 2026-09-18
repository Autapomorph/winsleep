use std::sync::Mutex;
use tokio::sync::oneshot;

#[derive(Default)]
pub struct ActiveTimer {
    pub cancel_tx: Option<oneshot::Sender<()>>,
    pub current_id: u64,
}

impl ActiveTimer {
    pub fn clear_if_matches(&mut self, timer_id: u64) {
        if self.current_id == timer_id {
            self.cancel_tx = None;
        }
    }
}

pub type ManagedTimer = Mutex<ActiveTimer>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_active_timer_clear_if_matches() {
        let (tx, _rx) = oneshot::channel();
        let mut timer = ActiveTimer {
            cancel_tx: Some(tx),
            current_id: 42,
        };

        // Non-matching id should not clear cancel_tx
        timer.clear_if_matches(99);
        assert!(timer.cancel_tx.is_some());

        // Matching id should clear cancel_tx
        timer.clear_if_matches(42);
        assert!(timer.cancel_tx.is_none());
    }
}

