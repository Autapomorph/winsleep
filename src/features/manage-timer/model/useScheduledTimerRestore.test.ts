import { renderHook } from '@testing-library/react';

import { useAppStateStore } from '@/entities/app-state';
import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import * as sharedLib from '@/shared/lib';
import { useScheduledTimerRestore } from './useScheduledTimerRestore';

vi.mock('@/shared/api', () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('@/shared/lib', async importOriginal => {
  return {
    ...(await importOriginal()),
    showInfoToast: vi.fn(),
    showWarningToast: vi.fn(),
  };
});

describe('useScheduledTimerRestore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ isRestoreScheduledTimerOnStartupEnabled: true });
    useAppStateStore.setState({ scheduledTimer: null });
    useKeepAwakeStore.setState({ isIndefiniteActive: false, startedAt: null });
    useSessionStore.setState({ timerAction: 'sleep' });
    useTimerStore.setState({
      timerState: 'idle',
      timerMode: 'duration',
      targetDateTime: null,
    });
  });

  test('restores future scheduled timer and activates timer', () => {
    const futureTime = Date.now() + 60000;
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: futureTime,
        timerAction: 'shutdown',
        armedAt: Date.now() - 10000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useSessionStore.getState().timerAction).toBe('shutdown');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('timestamp');
    expect(useTimerStore.getState().targetDateTime).toBe(futureTime);
    expect(sharedLib.showInfoToast).toHaveBeenCalled();
  });

  test('clears expired scheduled timer and warns user without triggering action', () => {
    const pastTime = Date.now() - 60000;
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: pastTime,
        timerAction: 'reboot',
        armedAt: Date.now() - 120000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(sharedLib.showWarningToast).toHaveBeenCalled();
  });

  test('restores indefinite keep-awake and activates keep-awake mode', () => {
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: null,
        timerAction: 'keep-awake',
        armedAt: Date.now() - 10000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useSessionStore.getState().timerAction).toBe('keep-awake');
    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useTimerStore.getState().remainingSeconds).toBe(0);
    expect(sharedLib.showInfoToast).toHaveBeenCalled();
  });

  test('does nothing for indefinite keep-awake when isRestoreScheduledTimerOnStartupEnabled is false', () => {
    useSettingsStore.setState({ isRestoreScheduledTimerOnStartupEnabled: false });
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: null,
        timerAction: 'keep-awake',
        armedAt: Date.now() - 10000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    expect(sharedLib.showInfoToast).not.toHaveBeenCalled();
  });

  test('restores scheduled timer with negative timestamp prior to 1970 when in future relative to now', () => {
    const originalNow = sharedLib.getDateNow;
    vi.spyOn(sharedLib, 'getDateNow').mockReturnValue(-20000);

    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: -10000,
        timerAction: 'sleep',
        armedAt: -30000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useSessionStore.getState().timerAction).toBe('sleep');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().targetDateTime).toBe(-10000);
    expect(sharedLib.showInfoToast).toHaveBeenCalled();

    vi.spyOn(sharedLib, 'getDateNow').mockImplementation(originalNow);
  });

  test('clears scheduled timer if targetDateTime is null for non-keep-awake action', () => {
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: null,
        timerAction: 'shutdown',
        armedAt: Date.now() - 10000,
      } as never,
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('does nothing when isRestoreScheduledTimerOnStartupEnabled is false', () => {
    useSettingsStore.setState({ isRestoreScheduledTimerOnStartupEnabled: false });
    const futureTime = Date.now() + 60000;
    useAppStateStore.setState({
      scheduledTimer: {
        targetDateTime: futureTime,
        timerAction: 'shutdown',
        armedAt: Date.now() - 10000,
      },
    });

    renderHook(() => useScheduledTimerRestore());

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(sharedLib.showInfoToast).not.toHaveBeenCalled();
  });
});
