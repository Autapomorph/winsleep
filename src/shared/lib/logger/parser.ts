import { type LogEntry, type LogLevel } from './types';

export const parseLogLine = (trimmed: string, suffix: string): LogEntry => {
  // Parse as JSON
  try {
    const parsed = JSON.parse(trimmed);

    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      return {
        id: `${parsed.timestamp ?? ''}-${suffix}`,
        timestamp: parsed.timestamp,
        level: parsed.level?.toUpperCase() as LogLevel,
        message: parsed.message,
      };
    }
  } catch {
    // Ignore invalid JSON lines, fallback to raw string representation
  }

  return {
    id: `raw-${suffix}`,
    message: trimmed,
  };
};
