import { act, renderHook } from '@testing-library/react';

import { useDebugLogsStore } from './debugLogs.store';
import { useDebugLogs } from './useDebugLogs';

describe('useDebugLogs polling hook', () => {
  const spyFetchLogs = vi.spyOn(useDebugLogsStore.getState(), 'fetchLogs').mockResolvedValue();

  beforeEach(() => {
    vi.useFakeTimers();
    useDebugLogsStore.setState({
      rawLogs: 'Mock logs content',
      parsedEntries: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedLevel: 'ALL',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('triggers initial delay fetch and sets up periodic polling', async () => {
    const { result } = renderHook(() => useDebugLogs(1000, 100));

    expect(result.current.rawLogs).toBe('Mock logs content');
    expect(spyFetchLogs).not.toHaveBeenCalled();

    // Advance past initial delay (100ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(1);

    // Advance past first polling interval (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(2);

    // Advance past second polling interval (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(3);
  });

  test('performs cleanups and resets debug log store on unmount', async () => {
    const { unmount } = renderHook(() => useDebugLogs(1000, 100));

    // Unmount hook immediately
    unmount();

    // Advance time and verify no fetches are called since it unmounted
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(spyFetchLogs).not.toHaveBeenCalled();

    // Verify debug logs store was reset to default state on unmount
    const state = useDebugLogsStore.getState();
    expect(state.rawLogs).toBe('');
    expect(state.parsedEntries).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.selectedLevel).toBe('ALL');
  });

  test('does not start polling when isEnabled is false', async () => {
    renderHook(() => useDebugLogs(1000, 100, false));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(spyFetchLogs).not.toHaveBeenCalled();
  });

  test('pauses and resumes polling when isEnabled changes, without wiping logs during pause', async () => {
    let enabled = true;
    const { rerender } = renderHook(() => useDebugLogs(1000, 100, enabled));

    // Initial fetch triggers after 100ms
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(1);

    // Disable polling (e.g. scrolled out of view)
    enabled = false;
    rerender();

    // Advance time and check that no new polls happen
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(1);

    // Logs are preserved in store while paused
    expect(useDebugLogsStore.getState().rawLogs).toBe('Mock logs content');

    // Re-enable polling (scrolled back into view)
    enabled = true;
    rerender();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(spyFetchLogs).toHaveBeenCalledTimes(2);
  });
});
