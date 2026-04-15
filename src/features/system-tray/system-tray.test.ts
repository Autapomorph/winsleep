import { act, renderHook } from '@testing-library/react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { typedInvoke, typedListen } from '@/shared/api';
import { sendSystemNotification } from '@/shared/lib';
import { useClosedToTrayNotification } from './model/useClosedToTrayNotification';
import { useTrayActionSelection } from './model/useTrayActionSelection';
import { useTrayLanguageSync } from './model/useTrayLanguageSync';
import { useTrayMode } from './model/useTrayMode';
import { useTrayStateSync } from './model/useTrayStateSync';
import { useTrayUpdateControl } from './model/useTrayUpdateControl';

const mockUnsubscribe = vi.fn();
let mockCapturedListeners: Record<string, (event: { payload?: unknown }) => Promise<void> | void> =
  {};

vi.mock(import('@/shared/api'), () => {
  return {
    typedInvoke: vi.fn().mockResolvedValue(undefined),
    typedListen: vi
      .fn()
      .mockImplementation(
        (event: string, callback: (event: { payload?: unknown }) => Promise<void> | void) => {
          mockCapturedListeners[event] = callback;
          return Promise.resolve(mockUnsubscribe);
        },
      ),
  };
});

const mockUpdateFn = vi.fn().mockResolvedValue(undefined);
vi.mock(import('@/entities/updater'), async importOriginal => {
  const original = await importOriginal();
  const mockUpdateStoreFullState = {
    status: 'idle',
    downloadProgress: 0,
    isManualCheck: false,
    updateInfo: null,
    errorMessage: null as string | null,
    changelogVersion: null as string | null,
    isChangelogOpen: false,
    checkUpdates: vi.fn(),
    installUpdate: vi.fn(),
    relaunchApp: vi.fn(),
    resetStore: vi.fn(),
    triggerMockUpdate: vi.fn(),
    openChangelog: vi.fn(),
    closeChangelog: vi.fn(),
  };

  return {
    ...original,
    useUpdater: () => mockUpdateFn,
    useUpdateStore: Object.assign(
      (selector?: (s: typeof mockUpdateStoreFullState) => unknown) =>
        selector ? selector(mockUpdateStoreFullState) : mockUpdateStoreFullState,
      {
        getState: () => mockUpdateStoreFullState,
        subscribe: vi.fn(),
      },
    ) as unknown as typeof original.useUpdateStore,
  };
});

vi.mock(import('@/shared/lib'), async importOriginal => {
  return {
    ...(await importOriginal()),
    formatTime: (s: number) => `${s}s`,
    formatDurationShort: (s: number) => `${s}s`,
    sendSystemNotification: vi.fn().mockResolvedValue(true),
  };
});

vi.mock(import('react-i18next'), async importOriginal => {
  const { createMockUseTranslation } = await import('@/tests/i18nMock');
  return {
    ...(await importOriginal()),
    useTranslation: createMockUseTranslation(),
  };
});

describe('system-tray feature model hooks', () => {
  beforeEach(() => {
    mockCapturedListeners = {};
    useTimerStore.setState({
      timerState: 'idle',
      plannedSeconds: 0,
      remainingSeconds: 0,
    });
    useSettingsStore.setState({
      hasSeenTrayNotification: false,
      isTrayModeEnabled: false,
    });
    useSessionStore.setState({
      timerAction: 'sleep',
    });
  });

  describe('useClosedToTrayNotification', () => {
    test('sends system notification on window close if not already seen', async () => {
      useSettingsStore.setState({ hasSeenTrayNotification: false });

      renderHook(() => useClosedToTrayNotification());

      expect(typedListen).toHaveBeenCalledWith('window-closed-to-tray', expect.any(Function));

      const cb = mockCapturedListeners['window-closed-to-tray'];
      await act(async () => {
        await cb({});
      });

      expect(sendSystemNotification).toHaveBeenCalled();
      expect(useSettingsStore.getState().hasSeenTrayNotification).toBe(true);
    });

    test('does not send notification if user has already seen it', async () => {
      useSettingsStore.setState({ hasSeenTrayNotification: true });

      renderHook(() => useClosedToTrayNotification());

      const cb = mockCapturedListeners['window-closed-to-tray'];
      await act(async () => {
        await cb({});
      });

      expect(sendSystemNotification).not.toHaveBeenCalled();
    });

    test('does not throw if unsubscribe fails', async () => {
      mockUnsubscribe.mockRejectedValueOnce(new Error('Unsubscribe failed'));

      const { unmount } = renderHook(() => useClosedToTrayNotification());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useTrayActionSelection', () => {
    test('sets timer action in session store when action is selected from tray', () => {
      renderHook(() => useTrayActionSelection());

      expect(typedListen).toHaveBeenCalledWith('tray-timer-action-selected', expect.any(Function));

      const cb = mockCapturedListeners['tray-timer-action-selected'];
      cb({ payload: 'hibernate' });

      expect(useSessionStore.getState().timerAction).toBe('hibernate');
    });

    test('does not throw if unsubscribe fails', async () => {
      mockUnsubscribe.mockRejectedValueOnce(new Error('Unsubscribe failed'));

      const { unmount } = renderHook(() => useTrayActionSelection());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useTrayLanguageSync', () => {
    test('dispatches tray menu configuration details and listens for sync requests', async () => {
      useTimerStore.setState({
        timerState: 'running',
        plannedSeconds: 300,
        remainingSeconds: 150,
      });

      renderHook(() => useTrayLanguageSync());

      expect(typedListen).toHaveBeenCalledWith('tray-sync-request', expect.any(Function));
      expect(typedInvoke).toHaveBeenCalledWith('update_tray_menu', expect.any(Object));

      // Trigger sync request listener
      const cb = mockCapturedListeners['tray-sync-request'];
      act(() => {
        cb({});
      });

      expect(typedInvoke).toHaveBeenNthCalledWith(2, 'update_tray_menu', expect.any(Object));

      // Error catching
      vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('Invoke error'));
      act(() => {
        cb({});
      });
    });

    test('handles different update statuses and timer states', () => {
      // 1. Paused timer
      useTimerStore.setState({ timerState: 'paused', remainingSeconds: 20 });
      renderHook(() => useTrayLanguageSync());
      expect(typedInvoke).toHaveBeenCalledWith(
        'update_tray_menu',
        expect.objectContaining({ timerState: 'paused' }),
      );
    });

    test('does not throw if unsubscribe fails on unmount', async () => {
      mockUnsubscribe.mockRejectedValueOnce(new Error('Unsubscribe failed'));

      const { unmount } = renderHook(() => useTrayLanguageSync());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useTrayStateSync', () => {
    test('syncs initial tray mode to backend', () => {
      useSettingsStore.setState({ isTrayModeEnabled: true });

      renderHook(() => useTrayStateSync());

      expect(typedInvoke).toHaveBeenCalledWith('set_is_tray_mode_enabled', { isEnabled: true });
    });
  });

  describe('useTrayUpdateControl', () => {
    test('triggers updates when clicked from tray menu', () => {
      renderHook(() => useTrayUpdateControl());

      expect(typedListen).toHaveBeenCalledWith('tray-update-clicked', expect.any(Function));

      const cb = mockCapturedListeners['tray-update-clicked'];
      cb({});

      expect(mockUpdateFn).toHaveBeenCalled();
    });

    test('does not throw if unsubscribe fails', async () => {
      mockUnsubscribe.mockRejectedValueOnce(new Error('Unsubscribe failed'));

      const { unmount } = renderHook(() => useTrayUpdateControl());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useTrayMode compound hook', () => {
    test('mounts all tray control hooks', () => {
      renderHook(() => useTrayMode());

      // Verify listeners are registered
      expect(mockCapturedListeners['window-closed-to-tray']).toBeDefined();
      expect(mockCapturedListeners['tray-timer-action-selected']).toBeDefined();
      expect(mockCapturedListeners['tray-sync-request']).toBeDefined();
      expect(mockCapturedListeners['tray-update-clicked']).toBeDefined();
    });
  });
});
