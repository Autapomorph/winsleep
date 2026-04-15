import { type LogEntry, type LogLevel } from './types';

export const parseLogLine = (trimmed: string, index: number): LogEntry => {
  // Parse as JSON
  try {
    const parsed = JSON.parse(trimmed);

    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      return {
        id: `${parsed.timestamp ?? ''}-${index}`,
        timestamp: parsed.timestamp,
        level: parsed.level?.toUpperCase() as LogLevel,
        message: parsed.message,
      };
    }
  } catch {
    // Ignore invalid JSON lines, fallback to raw string representation
  }

  return {
    id: `raw-${index}`,
    message: trimmed,
  };
};
