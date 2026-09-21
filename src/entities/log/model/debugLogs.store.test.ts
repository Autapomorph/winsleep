import { typedInvoke } from '@/shared/api';
import { useDebugLogsStore } from './debugLogs.store';

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
}));

describe('debugLogsStore', () => {
  beforeEach(() => {
    useDebugLogsStore.setState({
      error: null,
      hasMore: true,
      isLoading: false,
      isLoadingOlder: false,
      loadedLinesCount: 0,
      oldestCursor: null,
      parsedEntries: [],
      rawLogs: '',
      searchQuery: '',
      selectedLevel: 'ALL',
    });
  });

  test('should initialize with default state', () => {
    const state = useDebugLogsStore.getState();

    expect(state.rawLogs).toBe('');
    expect(state.parsedEntries).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.oldestCursor).toBeNull();
    expect(state.selectedLevel).toBe('ALL');
  });

  test('should fetch and parse log lines', async () => {
    const mockLogs =
      '{"timestamp":"1970-01-01T00:00:00Z","level":"info","message":"Tauri started"}\nInvalid JSON line';

    vi.mocked(typedInvoke).mockResolvedValueOnce({
      cursor: { fileName: 'WinSleep.1970-01-01.log', byteOffset: 123 },
      data: mockLogs,
      hasMore: false,
    });

    await useDebugLogsStore.getState().fetchLogs();

    const state = useDebugLogsStore.getState();

    expect(state.rawLogs).toBe(mockLogs);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.oldestCursor).toEqual({
      fileName: 'WinSleep.1970-01-01.log',
      byteOffset: 123,
    });
    expect(state.parsedEntries).toHaveLength(2);
    expect(state.parsedEntries[0]).toEqual({
      id: '1970-01-01T00:00:00Z-0',
      level: 'INFO',
      message: 'Tauri started',
      timestamp: '1970-01-01T00:00:00Z',
    });
    expect(state.parsedEntries[1]).toEqual({
      id: 'raw-1',
      message: 'Invalid JSON line',
    });
  });

  test('should handle fetchLogs errors', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('File not found'));

    await useDebugLogsStore.getState().fetchLogs();

    const state = useDebugLogsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('File not found');
  });

  test('should clear logs and reset state', async () => {
    useDebugLogsStore.setState({
      oldestCursor: { fileName: 'test.log', byteOffset: 456 },
      parsedEntries: [{ id: '1', message: 'test' }],
      rawLogs: 'some logs',
      searchQuery: 'test',
      selectedLevel: 'INFO',
    });

    vi.mocked(typedInvoke).mockResolvedValueOnce(undefined);

    await useDebugLogsStore.getState().clearLogs();

    const state = useDebugLogsStore.getState();

    expect(state.rawLogs).toBe('');
    expect(state.parsedEntries).toEqual([]);
    expect(state.oldestCursor).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.selectedLevel).toBe('ALL');
  });

  test('should handle clearLogs errors', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('Permission denied'));

    await expect(useDebugLogsStore.getState().clearLogs()).rejects.toThrow('Permission denied');
  });

  test('should reset filters', () => {
    useDebugLogsStore.setState({
      searchQuery: 'query',
      selectedLevel: 'WARN',
    });

    useDebugLogsStore.getState().resetFilters();

    const state = useDebugLogsStore.getState();

    expect(state.searchQuery).toBe('');
    expect(state.selectedLevel).toBe('ALL');
  });

  test('should load older logs with cursor and prepend them', async () => {
    const initialCursor = { fileName: 'WinSleep.1970-01-01.log', byteOffset: 500 };

    useDebugLogsStore.setState({
      hasMore: true,
      isLoadingOlder: false,
      loadedLinesCount: 1,
      oldestCursor: initialCursor,
      parsedEntries: [
        {
          id: '1970-01-01T00:00:01Z-0',
          level: 'INFO',
          message: 'Line 2',
          timestamp: '1970-01-01T00:00:01Z',
        },
      ],
    });

    const mockOlderLogs = '{"timestamp":"1970-01-01T00:00:00Z","level":"info","message":"Line 1"}';
    const nextCursor = { fileName: 'WinSleep.1970-01-01.log', byteOffset: 100 };

    vi.mocked(typedInvoke).mockResolvedValueOnce({
      cursor: nextCursor,
      data: mockOlderLogs,
      hasMore: false,
    });

    const added = await useDebugLogsStore.getState().loadOlderLogs();

    expect(typedInvoke).toHaveBeenCalledWith('read_logs', {
      cursor: initialCursor,
      limit: 1000,
    });
    expect(added).toBe(1);

    const state = useDebugLogsStore.getState();
    expect(state.parsedEntries).toHaveLength(2);
    expect(state.parsedEntries[0].message).toBe('Line 1');
    expect(state.parsedEntries[1].message).toBe('Line 2');
    expect(state.oldestCursor).toEqual(nextCursor);
    expect(state.hasMore).toBe(false);
  });
});
