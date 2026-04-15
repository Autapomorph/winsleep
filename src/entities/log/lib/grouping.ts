import { type LogEntry } from '@/shared/lib';

export interface LogGroup {
  dateStr: string | null;
  entries: LogEntry[];
}

export const groupLogEntries = (entries: LogEntry[], language: string) => {
  const groups: LogGroup[] = [];
  let currentGroup: LogGroup | null = null;

  entries.forEach(entry => {
    let dateStr: string | null = null;

    if (entry.timestamp) {
      try {
        const date = new Date(entry.timestamp);

        if (Number.isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }

        dateStr = date.toLocaleDateString(language, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        // ignore
      }
    }

    if (currentGroup?.dateStr !== dateStr) {
      currentGroup = { dateStr, entries: [] };
      groups.push(currentGroup);
    }

    currentGroup.entries.push(entry);
  });

  const flatEntries = groups.flatMap(g => g.entries);
  const groupCounts = groups.map(g => g.entries.length);

  return { groups, flatEntries, groupCounts };
};
