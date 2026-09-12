import { renderHook } from '@testing-library/react';

import { useAppStateStore } from '@/entities/app-state';
import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { useScheduledTimerStateSync } from './useScheduledTimerStateSync';

describe('useScheduledTimerStateSync', () => {
  beforeEach(() => {
    useAppStateStore.setState({ scheduledTimer: null });
    useSessionStore.setState({ timerAction: 'sleep' });
    useKeepAwakeStore.setState({ isIndefiniteActive: false, startedAt: null });
    useTimerStore.setState({
      timerState: 'idle',
      timerMode: 'duration',
      targetDateTime: null,
    });
  });

  test('synchronizes scheduled timer to appStateStore when timer starts in timestamp mode', () => {
    renderHook(() => useScheduledTimerStateSync());

    const targetTime = Date.now() + 60000;
    useSessionStore.setState({ timerAction: 'hibernate' });
    useTimerStore.setState({
      timerState: 'running',
      timerMode: 'timestamp',
      targetDateTime: targetTime,
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

    useSessionStore.setState({ timerAction: 'keep-awake' });
    useKeepAwakeStore.setState({ isIndefiniteActive: true, startedAt: Date.now() });

    const scheduled = useAppStateStore.getState().scheduledTimer;
    expect(scheduled).not.toBeNull();
    expect(scheduled?.targetDateTime).toBeNull();
    expect(scheduled?.timerAction).toBe('keep-awake');
  });

  test('clears scheduled timer from appStateStore when indefinite keep-awake is stopped', () => {
    renderHook(() => useScheduledTimerStateSync());

    useSessionStore.setState({ timerAction: 'keep-awake' });
    useKeepAwakeStore.setState({ isIndefiniteActive: true, startedAt: Date.now() });
    expect(useAppStateStore.getState().scheduledTimer).not.toBeNull();

    useKeepAwakeStore.setState({ isIndefiniteActive: false, startedAt: null });
    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
  });

  test('synchronizes scheduled keep-awake timer in timestamp mode', () => {
    renderHook(() => useScheduledTimerStateSync());

    const targetTime = Date.now() + 60000;
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({
      timerState: 'running',
      timerMode: 'timestamp',
      targetDateTime: targetTime,
    });

    const scheduled = useAppStateStore.getState().scheduledTimer;
    expect(scheduled).not.toBeNull();
    expect(scheduled?.targetDateTime).toBe(targetTime);
    expect(scheduled?.timerAction).toBe('keep-awake');
  });
});
