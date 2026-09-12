import { act, renderHook } from '@testing-library/react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { useTimerOrchestrator } from './useTimerOrchestrator';

vi.mock('@/shared/api', () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn().mockResolvedValue(() => {}),
}));

describe('useTimerOrchestrator', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    useSessionStore.setState({ timerAction: 'sleep', isLocked: false });
    useKeepAwakeStore.setState({ isIndefiniteActive: false, startedAt: null });
    useTimerStore.setState({
      timerState: 'idle',
      timerMode: 'duration',
      plannedSeconds: 1800,
      remainingSeconds: 1800,
      targetDateTime: null,
    });
  });

  test('computes effectiveTimerState and isIndefiniteMode correctly', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ plannedSeconds: 0, remainingSeconds: 0 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    expect(result.current.isIndefiniteMode).toBe(true);
    expect(result.current.effectiveTimerState).toBe('idle');

    act(() => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });
    });

    expect(result.current.effectiveTimerState).toBe('running');
  });

  test('computes effectiveTimerState as running and currentSeconds as 0 when isIndefiniteActive is true even if plannedSeconds was non-zero', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ plannedSeconds: 1800, remainingSeconds: 1800 });
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    expect(result.current.isIndefiniteMode).toBe(true);
    expect(result.current.effectiveTimerState).toBe('running');
    expect(result.current.currentSeconds).toBe(0);
  });

  test('handleStart starts indefinite when in indefinite keep-awake mode', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ plannedSeconds: 0, remainingSeconds: 0 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleStart();
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('handleStart starts normal timer when seconds > 0', () => {
    useSessionStore.setState({ timerAction: 'sleep' });
    useTimerStore.setState({ plannedSeconds: 60, remainingSeconds: 60 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleStart();
    });

    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('handlePause stops indefinite mode if active', () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handlePause();
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
  });

  test('handlePause pauses running timer', () => {
    useTimerStore.setState({ timerState: 'running', endTime: Date.now() + 60000 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handlePause();
    });

    expect(useTimerStore.getState().timerState).toBe('paused');
  });

  test('handleResume resumes indefinite when keep-awake at 0s', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ plannedSeconds: 0, remainingSeconds: 0 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleResume();
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
  });

  test('handleCancel stops indefinite and cancels timer', () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });
    useTimerStore.setState({ timerState: 'running', endTime: Date.now() + 60000 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleCancel();
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('executeImmediately stops indefinite if active', () => {
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.executeImmediately();
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('executeImmediately triggers onComplete when timer is running', () => {
    useTimerStore.setState({ timerState: 'running', endTime: Date.now() + 60000 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.executeImmediately();
    });

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('handleSetExactTime transitions from running timer to indefinite when set to 0', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ timerState: 'running', endTime: Date.now() + 60000 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleSetExactTime(0);
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
  });

  test('handleSetExactTime cancels paused timer and sets idle when set to 0 for keep-awake', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({ timerState: 'paused', remainingSeconds: 59 });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleSetExactTime(0);
    });

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
  });

  test('handleSetExactTime transitions from indefinite to running timer when set to > 0', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    const { result } = renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      result.current.handleSetExactTime(1800);
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    expect(useTimerStore.getState().plannedSeconds).toBe(1800);
    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('stops indefinite keep-awake when action changes to another action', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useKeepAwakeStore.setState({ isIndefiniteActive: true });

    renderHook(() => useTimerOrchestrator({ onComplete }));

    act(() => {
      useSessionStore.setState({ timerAction: 'sleep' });
    });

    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
  });
});
