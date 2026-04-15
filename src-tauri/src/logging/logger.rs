use std::fmt as std_fmt;
use tauri::Manager;
use tracing::{Event, Subscriber};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{
    fmt::{self, FmtContext, FormatEvent, FormatFields},
    layer::SubscriberExt,
    registry::LookupSpan,
    util::SubscriberInitExt,
    EnvFilter,
};

fn escape_json_string(s: &str) -> String {
    let mut escaped = String::with_capacity(s.len());

    for c in s.chars() {
        match c {
            '"' => escaped.push_str("\\\""),
            '\\' => escaped.push_str("\\\\"),
            '\n' => escaped.push_str("\\n"),
            '\r' => escaped.push_str("\\r"),
            '\t' => escaped.push_str("\\t"),
            _ => escaped.push(c),
        }
    }

    escaped
}

struct MessageVisitor {
    message: String,
}

impl tracing::field::Visit for MessageVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            let debug_str = format!("{:?}", value);
            if debug_str.starts_with('"') && debug_str.ends_with('"') && debug_str.len() >= 2 {
                self.message = debug_str[1..debug_str.len() - 1]
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\");
            } else {
                self.message = debug_str;
            }
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.message = value.to_string();
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
        let escaped_message = escape_json_string(&visitor.message);

        write!(
            writer,
            "{{\"timestamp\":\"{}\",\"level\":\"{}\",\"message\":\"{}\"}}\n",
            timestamp, level, escaped_message
        )?;

        Ok(())
    }
}

pub fn init(app_handle: &tauri::AppHandle) -> Result<WorkerGuard, Box<dyn std::error::Error>> {
    let log_dir = app_handle.path().app_log_dir()?;

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
