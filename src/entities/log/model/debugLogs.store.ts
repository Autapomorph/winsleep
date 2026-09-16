import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type LogChunk, typedInvoke } from '@/shared/api';
import { type LogEntry, type LogLevel, logger, parseLogLine } from '@/shared/lib';

export type DebugLogsStore = DebugLogsState & DebugLogsActions;

interface DebugLogsState {
  rawLogs: string;
  parsedEntries: LogEntry[];
  isLoading: boolean;
  isLoadingOlder: boolean;
  hasMore: boolean;
  loadedLinesCount: number;
  error: string | null;
  searchQuery: string;
  selectedLevel: LogLevelFilter;
}

export type LogLevelFilter = 'ALL' | LogLevel;

interface DebugLogsActions {
  fetchLogs: () => Promise<void>;
  loadOlderLogs: () => Promise<number>;
  setSearchQuery: (query: string) => void;
  setSelectedLevel: (level: LogLevelFilter) => void;
  resetFilters: () => void;
  clearLogs: () => Promise<void>;
}

const LOGS_PAGE_LIMIT = 1000;

const initialState: DebugLogsState = {
  error: null,
  hasMore: true,
  isLoading: false,
  isLoadingOlder: false,
  loadedLinesCount: 0,
  parsedEntries: [],
  rawLogs: '',
  searchQuery: '',
  selectedLevel: 'ALL',
};

const debugLogsSlice: StateCreator<
  DebugLogsStore,
  [['zustand/devtools', never]],
  [],
  DebugLogsStore
> = (set, get) => ({
  ...initialState,

  fetchLogs: async () => {
    const { parsedEntries, loadedLinesCount } = get();
    const hasLogs = parsedEntries.length > 0;

    if (!hasLogs) {
      set({ error: null, isLoading: true }, false, 'debugLogs/fetchLogs/pending');
    }

    try {
      if (!hasLogs) {
        // Initial load: fetch the first batch of recent logs
        const res = await typedInvoke('read_logs', { offset: 0, limit: LOGS_PAGE_LIMIT });
        const chunk: LogChunk = typeof res === 'string' ? { data: res, hasMore: false } : res;

        const lines = chunk.data
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        const parsed = lines.map((line, index) => parseLogLine(line, String(index)));

        set(
          {
            error: null,
            hasMore: chunk.hasMore,
            loadedLinesCount: parsed.length,
            parsedEntries: parsed,
            rawLogs: chunk.data,
          },
          false,
          'debugLogs/fetchLogs/fulfilled',
        );
      } else {
        // Polling check for new logs at the tail
        const res = await typedInvoke('read_logs', { offset: 0, limit: 50 });
        const chunk: LogChunk = typeof res === 'string' ? { data: res, hasMore: false } : res;

        const lines = chunk.data
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        if (lines.length > 0) {
          const currentLast = parsedEntries[parsedEntries.length - 1];
          const newParsed = lines.map((line, idx) =>
            parseLogLine(line, `poll-${loadedLinesCount}-${idx}`),
          );

          const lastIndexInNew = currentLast
            ? newParsed.findLastIndex(
                e =>
                  e.message === currentLast.message &&
                  e.timestamp === currentLast.timestamp &&
                  e.level === currentLast.level,
              )
            : -1;

          const freshEntries = lastIndexInNew >= 0 ? newParsed.slice(lastIndexInNew + 1) : [];

          if (freshEntries.length > 0) {
            set(
              {
                loadedLinesCount: loadedLinesCount + freshEntries.length,
                parsedEntries: [...parsedEntries, ...freshEntries],
              },
              false,
              'debugLogs/pollNewLogs/fulfilled',
            );
          }
        }
      }
    } catch (err) {
      logger.error(`Failed to fetch logs: ${err}`);
      set(
        {
          error: err instanceof Error ? err.message : String(err),
        },
        false,
        'debugLogs/fetchLogs/rejected',
      );
    } finally {
      if (!hasLogs) {
        set({ isLoading: false }, false, 'debugLogs/fetchLogs/settled');
      }
    }
  },

  loadOlderLogs: async () => {
    const { hasMore, isLoadingOlder, loadedLinesCount, parsedEntries } = get();

    if (isLoadingOlder || !hasMore) {
      return 0;
    }

    set({ isLoadingOlder: true }, false, 'debugLogs/loadOlderLogs/pending');

    try {
      const res = await typedInvoke('read_logs', {
        offset: loadedLinesCount,
        limit: LOGS_PAGE_LIMIT,
      });
      const chunk: LogChunk = typeof res === 'string' ? { data: res, hasMore: false } : res;

      const lines = chunk.data
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        set({ hasMore: false, isLoadingOlder: false }, false, 'debugLogs/loadOlderLogs/settled');
        return 0;
      }

      const olderParsed = lines.map((line, index) =>
        parseLogLine(line, `older-${loadedLinesCount}-${index}`),
      );

      set(
        {
          hasMore: chunk.hasMore,
          isLoadingOlder: false,
          loadedLinesCount: loadedLinesCount + olderParsed.length,
          parsedEntries: [...olderParsed, ...parsedEntries],
        },
        false,
        'debugLogs/loadOlderLogs/fulfilled',
      );

      return olderParsed.length;
    } catch (err) {
      logger.error(`Failed to load older logs: ${err}`);
      set({ isLoadingOlder: false }, false, 'debugLogs/loadOlderLogs/rejected');
      return 0;
    }
  },

  setSearchQuery: searchQuery => {
    set({ searchQuery }, false, 'debugLogs/setSearchQuery');
  },

  setSelectedLevel: selectedLevel => {
    set({ selectedLevel }, false, 'debugLogs/setSelectedLevel');
  },

  clearLogs: async () => {
    try {
      await typedInvoke('clear_logs');
      set(
        {
          hasMore: false,
          isLoadingOlder: false,
          loadedLinesCount: 0,
          parsedEntries: [],
          rawLogs: '',
          searchQuery: '',
          selectedLevel: 'ALL',
        },
        false,
        'debugLogs/clearLogs/fulfilled',
      );
    } catch (error) {
      logger.error(`Failed to clear logs: ${error}`);
      throw error;
    }
  },

  resetFilters: () => {
    set(
      {
        searchQuery: '',
        selectedLevel: 'ALL',
      },
      false,
      'debugLogs/resetFilters',
    );
  },
});

export const useDebugLogsStore = create<DebugLogsStore>()(
  devtools(debugLogsSlice, {
    name: 'debugLogs',
  }),
);
