import { renderHook } from '@testing-library/react';

import { useSettingsStore } from '@/entities/setting';
import { useUpdateStore } from '@/entities/updater';
import { typedInvoke } from '@/shared/api';
import { useAutoInstallOnExit } from './useAutoInstallOnExit';

const mockListeners: Record<string, (event: { payload: unknown }) => Promise<void> | void> = {};

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn((event, callback) => {
    mockListeners[event] = callback;
    return Promise.resolve(() => {
      delete mockListeners[event];
    });
  }),
}));

describe('useAutoInstallOnExit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockListeners).forEach(key => {
      delete mockListeners[key];
    });

    useSettingsStore.setState({
      isAutoUpdateEnabled: true,
    });

    useUpdateStore.setState({
      status: 'idle',
      installUpdate: vi.fn().mockResolvedValue(undefined),
    });
  });

  test('subscribes to app-exit-requested on mount and unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAutoInstallOnExit());

    expect(mockListeners['app-exit-requested']).toBeDefined();

    unmount();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockListeners['app-exit-requested']).toBeUndefined();
  });

  test('calls quit_app directly without installing when status is not readyToRestart', async () => {
    const installUpdateMock = vi.fn().mockResolvedValue(undefined);
    useUpdateStore.setState({
      status: 'idle',
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).not.toHaveBeenCalled();
    expect(typedInvoke).toHaveBeenCalledWith('quit_app');
  });

  test('calls quit_app directly without installing when isAutoUpdateEnabled is false and not manually checked', async () => {
    const installUpdateMock = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({
      isAutoUpdateEnabled: false,
    });
    useUpdateStore.setState({
      status: 'readyToRestart',
      isManualCheck: false,
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).not.toHaveBeenCalled();
    expect(typedInvoke).toHaveBeenCalledWith('quit_app');
  });

  test('installs update when isAutoUpdateEnabled is false but isManualCheck is true', async () => {
    const installUpdateMock = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({
      isAutoUpdateEnabled: false,
    });
    useUpdateStore.setState({
      status: 'readyToRestart',
      isManualCheck: true,
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).toHaveBeenCalledTimes(1);
    expect(typedInvoke).toHaveBeenCalledWith('quit_app');
  });

  test('installs update and then calls quit_app when isAutoUpdateEnabled is true and status is readyToRestart', async () => {
    const installUpdateMock = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({
      isAutoUpdateEnabled: true,
    });
    useUpdateStore.setState({
      status: 'readyToRestart',
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).toHaveBeenCalledTimes(1);
    expect(typedInvoke).toHaveBeenCalledWith('quit_app');
  });

  test('calls quit_app even if installUpdate fails', async () => {
    const installUpdateMock = vi.fn().mockRejectedValue(new Error('Install failed'));
    useSettingsStore.setState({
      isAutoUpdateEnabled: true,
    });
    useUpdateStore.setState({
      status: 'readyToRestart',
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).toHaveBeenCalledTimes(1);
    expect(typedInvoke).toHaveBeenCalledWith('quit_app');
  });

  test('ignores duplicate exit requests', async () => {
    const installUpdateMock = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({
      isAutoUpdateEnabled: true,
    });
    useUpdateStore.setState({
      status: 'readyToRestart',
      installUpdate: installUpdateMock,
    });

    renderHook(() => useAutoInstallOnExit());

    await mockListeners['app-exit-requested']({ payload: undefined });
    await mockListeners['app-exit-requested']({ payload: undefined });

    expect(installUpdateMock).toHaveBeenCalledTimes(1);
    expect(typedInvoke).toHaveBeenCalledTimes(1);
  });
});
