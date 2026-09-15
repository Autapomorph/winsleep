use std::fmt as std_fmt;
use tracing::{Event, Subscriber};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{
    fmt::{self, FmtContext, FormatEvent, FormatFields},
    layer::SubscriberExt,
    registry::LookupSpan,
    util::SubscriberInitExt,
    EnvFilter,
};

#[derive(serde::Serialize)]
struct JsonLogEntry<'a> {
    timestamp: &'a str,
    level: &'a str,
    message: &'a str,
}

struct MessageVisitor {
    message: String,
}

impl tracing::field::Visit for MessageVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            use std::fmt::Write;
            let _ = write!(&mut self.message, "{:?}", value);
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.message.push_str(value);
        }
    }
}

struct JsonFormatter;

impl<S, N> FormatEvent<S, N> for JsonFormatter
where
    S: Subscriber + for<'a> LookupSpan<'a>,
    N: for<'a> FormatFields<'a> + 'static,
{
    fn format_event(
        &self,
        _ctx: &FmtContext<'_, S, N>,
        mut writer: fmt::format::Writer<'_>,
        event: &Event<'_>,
    ) -> std_fmt::Result {
        let metadata = event.metadata();

        let mut visitor = MessageVisitor {
            message: String::new(),
        };
        event.record(&mut visitor);

        let timestamp = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
        let level = metadata.level().to_string();

        let entry = JsonLogEntry {
            timestamp: &timestamp,
            level: &level,
            message: &visitor.message,
        };

        if let Ok(json) = serde_json::to_string(&entry) {
            writeln!(writer, "{json}")?;
        }

        Ok(())
    }
}

pub fn init(app_handle: &tauri::AppHandle) -> Result<WorkerGuard, Box<dyn std::error::Error>> {
    let log_dir = crate::paths::get_log_dir(app_handle)?;

    std::fs::create_dir_all(&log_dir)?;

    let file_appender = tracing_appender::rolling::Builder::new()
        .rotation(tracing_appender::rolling::Rotation::DAILY)
        .filename_prefix("WinSleep")
        .filename_suffix("log")
        .build(&log_dir)?;

    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    let filter = EnvFilter::try_from_env("WINSLEEP_LOG").unwrap_or_else(|_| {
        EnvFilter::new(if cfg!(debug_assertions) {
            "debug"
        } else {
            "info"
        })
    });

    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .event_format(JsonFormatter);

    let registry = tracing_subscriber::registry().with(filter).with(file_layer);

    if cfg!(debug_assertions) {
        registry.with(fmt::layer().with_target(true)).init();
    } else {
        registry.init();
    }

    Ok(guard)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};
    use tracing_subscriber::layer::SubscriberExt;

    #[derive(Clone)]
    struct BufferWriter(Arc<Mutex<Vec<u8>>>);

    impl std::io::Write for BufferWriter {
        fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
            self.0.lock().unwrap().extend_from_slice(buf);
            Ok(buf.len())
        }

        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }

    impl<'a> tracing_subscriber::fmt::MakeWriter<'a> for BufferWriter {
        type Writer = BufferWriter;
        fn make_writer(&'a self) -> Self::Writer {
            self.clone()
        }
    }

    #[test]
    fn test_json_formatter_plain_and_formatted_messages() {
        let buffer = Arc::new(Mutex::new(Vec::new()));
        let writer = BufferWriter(Arc::clone(&buffer));

        let layer = fmt::layer()
            .with_writer(writer)
            .with_ansi(false)
            .event_format(JsonFormatter);

        let subscriber = tracing_subscriber::registry().with(layer);

        tracing::subscriber::with_default(subscriber, || {
            tracing::info!("Plain log message");
            tracing::info!("Formatted duration: {}s", 60);
            tracing::info!("Path with backslashes: C:\\Program Files\\WinSleep");
            tracing::info!("\"Legitimate outer quotes\"");
            tracing::warn!("Warning: line 1\nline 2");
        });

        let output = String::from_utf8(buffer.lock().unwrap().clone()).unwrap();
        let lines: Vec<&str> = output.lines().filter(|l| !l.trim().is_empty()).collect();

        assert_eq!(lines.len(), 5);

        let entry0: serde_json::Value = serde_json::from_str(lines[0]).unwrap();
        assert_eq!(entry0["level"], "INFO");
        assert_eq!(entry0["message"], "Plain log message");
        assert!(entry0["timestamp"].is_string());

        let entry1: serde_json::Value = serde_json::from_str(lines[1]).unwrap();
        assert_eq!(entry1["level"], "INFO");
        assert_eq!(entry1["message"], "Formatted duration: 60s");

        let entry2: serde_json::Value = serde_json::from_str(lines[2]).unwrap();
        assert_eq!(entry2["level"], "INFO");
        assert_eq!(
            entry2["message"],
            "Path with backslashes: C:\\Program Files\\WinSleep"
        );

        let entry3: serde_json::Value = serde_json::from_str(lines[3]).unwrap();
        assert_eq!(entry3["level"], "INFO");
        assert_eq!(entry3["message"], "\"Legitimate outer quotes\"");

        let entry4: serde_json::Value = serde_json::from_str(lines[4]).unwrap();
        assert_eq!(entry4["level"], "WARN");
        assert_eq!(entry4["message"], "Warning: line 1\nline 2");
    }
}
