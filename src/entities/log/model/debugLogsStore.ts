import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { typedInvoke } from '@/shared/api';
import { type LogEntry, type LogLevel, logger, parseLogLine } from '@/shared/lib';

export type LogLevelFilter = 'ALL' | LogLevel;

export type DebugLogsStore = DebugLogsState & DebugLogsActions;

interface DebugLogsState {
  rawLogs: string;
  parsedEntries: LogEntry[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedLevel: LogLevelFilter;
}

interface DebugLogsActions {
  fetchLogs: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedLevel: (level: LogLevelFilter) => void;
  resetFilters: () => void;
  clearLogs: () => Promise<void>;
}

const initialState: DebugLogsState = {
  rawLogs: '',
  parsedEntries: [],
  isLoading: false,
  error: null,
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
    // Don't flash loading spinner on poll updates
    const hasLogs = get().rawLogs.length > 0;

    if (!hasLogs) {
      set({ isLoading: true, error: null }, false, 'debugLogs/fetchLogs/pending');
    }

    try {
      const content = await typedInvoke('read_logs');

      // Only parse and update if content has changed
      if (content !== get().rawLogs) {
        const parsed = content
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map((line, index) => parseLogLine(line, index));

        set(
          { rawLogs: content, parsedEntries: parsed, error: null },
          false,
          'debugLogs/fetchLogs/fulfilled',
        );
      } else if (!hasLogs) {
        // If content did not change but it was the first load (empty logs)
        set({ error: null }, false, 'debugLogs/fetchLogs/fulfilled');
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

  setSearchQuery: searchQuery => set({ searchQuery }, false, 'debugLogs/setSearchQuery'),
  setSelectedLevel: selectedLevel => set({ selectedLevel }, false, 'debugLogs/setSelectedLevel'),

  clearLogs: async () => {
    try {
      await typedInvoke('clear_logs');
      set(
        {
          rawLogs: '',
          parsedEntries: [],
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

  resetFilters: () =>
    set(
      {
        searchQuery: '',
        selectedLevel: 'ALL',
      },
      false,
      'debugLogs/resetFilters',
    ),
});

export const useDebugLogsStore = create<DebugLogsStore>()(
  devtools(debugLogsSlice, {
    name: 'debugLogs',
  }),
);
