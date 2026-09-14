import type { LogEntry } from '@/shared/lib';
import { groupLogEntries } from './grouping';

describe('groupLogEntries', () => {
  test('groups log entries by localized date string', () => {
    const entries: LogEntry[] = [
      {
        id: '1',
        timestamp: '1970-01-01T00:00:00Z',
        level: 'INFO' as const,
        message: 'Hello',
      },
      {
        id: '2',
        timestamp: '1970-01-01T12:00:00Z',
        level: 'WARN' as const,
        message: 'World',
      },
      {
        id: '3',
        timestamp: '1970-01-02T00:00:00Z',
        level: 'ERROR' as const,
        message: 'Error',
      },
    ];

    const result = groupLogEntries(entries, 'en-US');

    expect(result.groups).toHaveLength(2);
    expect(result.groupCounts).toEqual([2, 1]);
    expect(result.flatEntries).toHaveLength(3);
  });

  test('handles invalid dates gracefully without throwing', () => {
    const entries = [
      {
        id: '1',
        timestamp: 'invalid-date',
        level: 'INFO' as const,
        message: 'Hello',
      },
    ];

    const result = groupLogEntries(entries, 'en-US');

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].dateStr).toBeNull();
  });

  test('correctly groups many entries on the same day into a single group', () => {
    const entries: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      timestamp: '2026-09-14T10:00:00Z',
      level: 'INFO' as const,
      message: `Log ${i}`,
    }));

    const result = groupLogEntries(entries, 'en-US');

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].entries).toHaveLength(50);
    expect(result.groupCounts).toEqual([50]);
    expect(result.flatEntries).toHaveLength(50);
  });
});
