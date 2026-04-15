use std::sync::Mutex;
use tokio::sync::oneshot;

#[derive(Default)]
pub struct ActiveTimer {
    pub cancel_tx: Option<oneshot::Sender<()>>,
}

pub type ManagedTimer = Mutex<ActiveTimer>;
