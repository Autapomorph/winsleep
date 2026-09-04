import { act, renderHook } from '@testing-library/react';
import { type Mock } from 'vitest';

import { useAppStateStore } from '@/entities/app-state';
import { useSettingsStore } from '@/entities/setting';
import { useUpdateStore } from '@/entities/updater';
import { useAutoUpdater } from './useAutoUpdater';

const mockListeners: Record<string, () => void> = {};

vi.mock(import('@/shared/api'), () => ({
  typedListen: vi.fn((event, callback) => {
    mockListeners[event] = callback;
    return Promise.resolve(() => {
      delete mockListeners[event];
    });
  }),
}));

describe('useAutoUpdater', () => {
  let checkUpdatesMock: Mock<(options?: { isManual?: boolean }) => Promise<void>>;

  beforeEach(() => {
    vi.useFakeTimers();

    Object.keys(mockListeners).forEach(key => {
      delete mockListeners[key];
    });

    checkUpdatesMock = vi.fn().mockImplementation(async () => {
      useUpdateStore.setState({ status: 'upToDate' });
    });

    useSettingsStore.setState({
      isAutoUpdateEnabled: true,
      updateInterval: 6,
    });

    useAppStateStore.setState({
      lastUpdateCheckAt: null,
    });

    useUpdateStore.setState({
      status: 'idle',
      checkUpdates: checkUpdatesMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('does not schedule checks when isAutoUpdateEnabled is false', () => {
    useSettingsStore.setState({ isAutoUpdateEnabled: false });

    renderHook(() => useAutoUpdater());

    vi.advanceTimersByTime(10000);
    expect(checkUpdatesMock).not.toHaveBeenCalled();
  });

  test('runs check after startup delay when updateInterval is startup', async () => {
    useSettingsStore.setState({ updateInterval: 'startup' });

    renderHook(() => useAutoUpdater());

    expect(checkUpdatesMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(100000);
    });

    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);
  });

  test('runs check after startup delay when lastUpdateCheckAt is null', async () => {
    renderHook(() => useAutoUpdater());

    expect(checkUpdatesMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);
  });

  test('runs check after startup delay when interval has already elapsed', async () => {
    const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
    useAppStateStore.setState({ lastUpdateCheckAt: eightHoursAgo });

    renderHook(() => useAutoUpdater());

    expect(checkUpdatesMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);
  });

  test('waits remaining interval time when last check was recent', async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    useAppStateStore.setState({ lastUpdateCheckAt: twoHoursAgo });

    renderHook(() => useAutoUpdater());

    // After startup delay (3s), it should NOT have run
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(checkUpdatesMock).not.toHaveBeenCalled();

    // Advance 3 hours (total 5h since check, 6h interval not yet reached)
    await act(async () => {
      vi.advanceTimersByTime(3 * 60 * 60 * 1000);
    });
    expect(checkUpdatesMock).not.toHaveBeenCalled();

    // Advance 1 more hour (remaining 4 hours elapsed)
    await act(async () => {
      vi.advanceTimersByTime(1 * 60 * 60 * 1000);
    });
    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);
  });

  test('updates lastUpdateCheckAt in app-state store when check finishes with upToDate', async () => {
    renderHook(() => useAutoUpdater());

    useUpdateStore.setState({ status: 'checking' });
    useUpdateStore.setState({ status: 'upToDate' });

    expect(useAppStateStore.getState().lastUpdateCheckAt).not.toBeNull();
  });

  test('updates lastUpdateCheckAt in app-state store when check finishes with available', async () => {
    renderHook(() => useAutoUpdater());

    useUpdateStore.setState({ status: 'checking' });
    useUpdateStore.setState({ status: 'available' });

    expect(useAppStateStore.getState().lastUpdateCheckAt).not.toBeNull();
  });

  test('does not update lastUpdateCheckAt when check fails with error', async () => {
    renderHook(() => useAutoUpdater());

    useUpdateStore.setState({ status: 'checking' });
    useUpdateStore.setState({ status: 'error' });

    expect(useAppStateStore.getState().lastUpdateCheckAt).toBeNull();
  });

  test('reschedules check on system-resume if interval elapsed during sleep', async () => {
    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
    useAppStateStore.setState({ lastUpdateCheckAt: fiveHoursAgo });

    renderHook(() => useAutoUpdater());

    // Fast-forward system time to simulate 2 hours sleep
    const sevenHoursAgo = Date.now() - 7 * 60 * 60 * 1000;
    useAppStateStore.setState({ lastUpdateCheckAt: sevenHoursAgo });

    // Trigger system-resume
    expect(mockListeners['system-resume']).toBeDefined();
    mockListeners['system-resume']();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(checkUpdatesMock).toHaveBeenCalledTimes(1);
  });
});
