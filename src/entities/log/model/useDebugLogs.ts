import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDebugLogsStore } from './debugLogs.store';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_INITIAL_DELAY_MS = 200;

export const useDebugLogs = (
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  initialDelayMs: number = DEFAULT_INITIAL_DELAY_MS,
) => {
  const { fetchLogs, rawLogs, isLoading, error } = useDebugLogsStore(
    useShallow(state => ({
      fetchLogs: state.fetchLogs,
      rawLogs: state.rawLogs,
      isLoading: state.isLoading,
      error: state.error,
    })),
  );

  // Set up polling for real-time log updates (starting after completion)
  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | undefined;

    const poll = async () => {
      await fetchLogs();

      if (isMounted) {
        timeoutId = setTimeout(poll, pollIntervalMs);
      }
    };

    const initialTimeoutId = setTimeout(() => {
      poll();
    }, initialDelayMs);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeoutId);
      clearTimeout(timeoutId);
      useDebugLogsStore.setState({
        rawLogs: '',
        parsedEntries: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        selectedLevel: 'ALL',
      });
    };
  }, [fetchLogs, pollIntervalMs, initialDelayMs]);

  return {
    rawLogs,
    isLoading,
    error,
    refetchLogs: fetchLogs,
  };
};
