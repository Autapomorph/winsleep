import { type LogEntry } from '@/shared/lib';

export interface LogGroup {
  dateStr: string | null;
  entries: LogEntry[];
}

export const groupLogEntries = (entries: LogEntry[], language: string) => {
  const groups: LogGroup[] = [];
  let currentGroup: LogGroup | null = null;
  const dateCache = new Map<string, string>();

  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    // Ignore invalid language tag fallback
  }

  entries.forEach(entry => {
    let dateStr: string | null = null;

    if (entry.timestamp) {
      try {
        const date = new Date(entry.timestamp);

        if (!Number.isNaN(date.getTime())) {
          const localDateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

          let cached = dateCache.get(localDateKey);

          if (!cached) {
            cached = formatter
              ? formatter.format(date)
              : date.toLocaleDateString(language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

            dateCache.set(localDateKey, cached);
          }

          dateStr = cached;
        }
      } catch {
        // Шgnore
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
