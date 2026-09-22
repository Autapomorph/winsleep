import { renderHook } from '@testing-library/react';

import { useAppStateStore } from '@/entities/app-state';
import { useTimerStore } from '@/entities/timer';
import { useScheduledTimerStateSync } from './useScheduledTimerStateSync';

describe('useScheduledTimerStateSync', () => {
  beforeEach(() => {
    useAppStateStore.setState({ scheduledTimer: null });
    useTimerStore.setState({
      targetDateTime: null,
      timerAction: 'sleep',
      timerMode: 'duration',
      timerState: 'idle',
    });
  });

  test('synchronizes scheduled timer to appStateStore when timer starts in timestamp mode', () => {
    renderHook(() => useScheduledTimerStateSync());

    const targetTime = Date.now() + 60000;
    useTimerStore.setState({
      targetDateTime: targetTime,
      timerAction: 'hibernate',
      timerMode: 'timestamp',
      timerState: 'running',
    });

    const scheduled = useAppStateStore.getState().scheduledTimer;
    expect(scheduled).not.toBeNull();
    expect(scheduled?.targetDateTime).toBe(targetTime);
    expect(scheduled?.timerAction).toBe('hibernate');
  });

  test('clears scheduled timer from appStateStore when timer becomes idle', () => {
    renderHook(() => useScheduledTimerStateSync());

    const targetTime = Date.now() + 60000;
    useTimerStore.setState({
      timerState: 'running',
      timerMode: 'timestamp',
      targetDateTime: targetTime,
    });
    expect(useAppStateStore.getState().scheduledTimer).not.toBeNull();

    useTimerStore.setState({
      timerState: 'idle',
    });
    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
  });

  test('synchronizes indefinite keep-awake to appStateStore with targetDateTime null', () => {
    renderHook(() => useScheduledTimerStateSync());

    useTimerStore.setState({
      targetDateTime: null,
      timerAction: 'keep-awake',
      timerMode: 'indefinite',
      timerState: 'running',
    });

    const scheduled = useAppStateStore.getState().scheduledTimer;
    expect(scheduled).not.toBeNull();
    expect(scheduled?.targetDateTime).toBeNull();
    expect(scheduled?.timerAction).toBe('keep-awake');
  });

  test('clears scheduled timer from appStateStore when indefinite keep-awake is stopped', () => {
    renderHook(() => useScheduledTimerStateSync());

    useTimerStore.setState({
      targetDateTime: null,
      timerAction: 'keep-awake',
      timerMode: 'indefinite',
      timerState: 'running',
    });
    expect(useAppStateStore.getState().scheduledTimer).not.toBeNull();

    useTimerStore.setState({
      timerState: 'idle',
    });
    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
  });

  test('synchronizes scheduled keep-awake timer in timestamp mode', () => {
    renderHook(() => useScheduledTimerStateSync());

    const targetTime = Date.now() + 60000;
    useTimerStore.setState({
      targetDateTime: targetTime,
      timerAction: 'keep-awake',
      timerMode: 'timestamp',
      timerState: 'running',
    });

    const scheduled = useAppStateStore.getState().scheduledTimer;
    expect(scheduled).not.toBeNull();
    expect(scheduled?.targetDateTime).toBe(targetTime);
    expect(scheduled?.timerAction).toBe('keep-awake');
  });
});
