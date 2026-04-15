import { parseLogLine } from './parser';
import './types';

describe('parseLogLine', () => {
  test('should parse valid JSON log entries correctly', () => {
    const jsonStr = JSON.stringify({
      timestamp: '1970-01-01T00:00:00Z',
      level: 'info',
      message: 'App started',
    });

    const entry = parseLogLine(jsonStr, 1);
    expect(entry).toEqual({
      id: '1970-01-01T00:00:00Z-1',
      timestamp: '1970-01-01T00:00:00Z',
      level: 'INFO',
      message: 'App started',
    });
  });

  test('should parse valid JSON log entries without timestamp', () => {
    const jsonStr = JSON.stringify({
      level: 'info',
      message: 'App started',
    });

    const entry = parseLogLine(jsonStr, 4);
    expect(entry).toEqual({
      id: '-4',
      timestamp: undefined,
      level: 'INFO',
      message: 'App started',
    });
  });

  test('should fallback to raw message for invalid JSON', () => {
    const rawStr = 'Raw non-JSON log line';
    const entry = parseLogLine(rawStr, 2);
    expect(entry).toEqual({
      id: 'raw-2',
      message: rawStr,
    });
  });

  test('should fallback to raw message for JSON without message property', () => {
    const jsonStr = JSON.stringify({
      timestamp: '1970-01-01T00:00:00Z',
      level: 'info',
    });

    const entry = parseLogLine(jsonStr, 3);
    expect(entry).toEqual({
      id: 'raw-3',
      message: jsonStr,
    });
  });
});
