import { act, renderHook } from '@testing-library/react';

import { useAppStateStore } from '@/entities/app-state';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { useTimerDefaults } from './useTimerDefaults';

describe('useTimerDefaults', () => {
  const setExactTime = vi.fn();

  beforeEach(() => {
    useSessionStore.setState({
      timerAction: 'sleep',
      isInitialized: false,
      isLocked: false,
    });
    useSettingsStore.setState({
      defaultTimerAction: 'hibernate',
      shouldRememberSelectedTimerAction: false,
      defaultTimerSeconds: 3600,
      shouldRememberConfiguredTime: false,
      isLockedByDefault: true,
      isRestoreScheduledTimerOnStartupEnabled: true,
    });
    useAppStateStore.setState({ scheduledTimer: null });
    useTimerStore.setState({
      timerMode: 'duration',
      plannedSeconds: 1800,
    });
  });

  test('applies default action, seconds and lock state on initial mount when no scheduled timer', () => {
    renderHook(() => useTimerDefaults({ setExactTime }));

    expect(useSessionStore.getState().timerAction).toBe('hibernate');
    expect(setExactTime).toHaveBeenCalledWith(3600);
    expect(useSessionStore.getState().isLocked).toBe(true);
    expect(useSessionStore.getState().isInitialized).toBe(true);
  });

  test('does not overwrite action and time if restorable scheduled timer exists', () => {
    useSessionStore.setState({ timerAction: 'sleep' });
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: Date.now() + 60000,
        timerAction: 'shutdown',
        armedAt: Date.now() - 1000,
      },
    });

    renderHook(() => useTimerDefaults({ setExactTime }));

    expect(useSessionStore.getState().timerAction).toBe('sleep');
    expect(setExactTime).not.toHaveBeenCalled();
    expect(useSessionStore.getState().isInitialized).toBe(true);
  });

  test('does not overwrite action and time if restorable indefinite keep-awake exists', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: null,
        timerAction: 'keep-awake',
        armedAt: Date.now() - 1000,
      },
    });

    renderHook(() => useTimerDefaults({ setExactTime }));

    expect(useSessionStore.getState().timerAction).toBe('keep-awake');
    expect(setExactTime).not.toHaveBeenCalled();
    expect(useSessionStore.getState().isInitialized).toBe(true);
  });

  test('updates defaultTimerSeconds when shouldRememberConfiguredTime is enabled', () => {
    useSessionStore.setState({ isInitialized: true });
    useSettingsStore.setState({ shouldRememberConfiguredTime: true });

    renderHook(() => useTimerDefaults({ setExactTime }));

    act(() => {
      useTimerStore.setState({ plannedSeconds: 7200 });
    });

    expect(useSettingsStore.getState().defaultTimerSeconds).toBe(7200);
  });

  test('updates defaultTimerAction when shouldRememberSelectedTimerAction is enabled', () => {
    useSessionStore.setState({ isInitialized: true });
    useSettingsStore.setState({ shouldRememberSelectedTimerAction: true });

    renderHook(() => useTimerDefaults({ setExactTime }));

    act(() => {
      useSessionStore.setState({ timerAction: 'lock' });
    });

    expect(useSettingsStore.getState().defaultTimerAction).toBe('lock');
  });
});
