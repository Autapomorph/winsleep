import { act, renderHook } from '@testing-library/react';

import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { useTimerOrchestrator } from './useTimerOrchestrator';

vi.mock('@/shared/api', () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn().mockResolvedValue(() => {}),
}));

const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/manage-timer', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/manage-timer')>();
  return {
    ...actual,
    useTimerExecution: () => ({ execute: mockExecute }),
  };
});

describe('useTimerOrchestrator', () => {
  beforeEach(() => {
    mockExecute.mockClear();
    useSessionStore.setState({ timerAction: 'sleep', isLocked: false });
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
    useTimerStore.setState({
      timerMode: 'indefinite',
      timerState: 'idle',
      plannedSeconds: 0,
      remainingSeconds: 0,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    expect(result.current.isIndefiniteMode).toBe(true);
    expect(result.current.effectiveTimerState).toBe('idle');
    expect(result.current.currentSeconds).toBe(0);

    act(() => {
      useTimerStore.setState({ timerState: 'running' });
    });

    expect(result.current.effectiveTimerState).toBe('running');
    expect(result.current.currentSeconds).toBe(0);
  });

  test('computes currentSeconds as remainingSeconds when running in duration mode', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'running',
      plannedSeconds: 1800,
      remainingSeconds: 1200,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    expect(result.current.isIndefiniteMode).toBe(false);
    expect(result.current.effectiveTimerState).toBe('running');
    expect(result.current.currentSeconds).toBe(1200);
  });

  test('handleStart starts indefinite when in indefinite mode', () => {
    useSessionStore.setState({ timerAction: 'keep-awake' });
    useTimerStore.setState({
      timerMode: 'indefinite',
      timerState: 'idle',
      plannedSeconds: 0,
      remainingSeconds: 0,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleStart();
    });

    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('indefinite');
  });

  test('handleStart starts normal timer when in duration mode', () => {
    useSessionStore.setState({ timerAction: 'sleep' });
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'idle',
      plannedSeconds: 60,
      remainingSeconds: 60,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleStart();
    });

    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('handlePause pauses running duration timer', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'running',
      endTime: Date.now() + 60000,
      remainingSeconds: 60,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handlePause();
    });

    expect(useTimerStore.getState().timerState).toBe('paused');
  });

  test('handleResume resumes paused duration timer', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'paused',
      remainingSeconds: 60,
      plannedSeconds: 60,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleResume();
    });

    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('handleCancel cancels timer to idle', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'running',
      endTime: Date.now() + 60000,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleCancel();
    });

    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('executeImmediately triggers execute when timer is running', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'running',
      endTime: Date.now() + 60000,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.executeImmediately();
    });

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  test('executeImmediately does not trigger execute when timer is idle', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'idle',
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.executeImmediately();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('handleSetExactTime updates planned and remaining seconds in idle duration mode', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'idle',
      plannedSeconds: 300,
      remainingSeconds: 300,
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleSetExactTime(600);
    });

    expect(useTimerStore.getState().plannedSeconds).toBe(600);
    expect(useTimerStore.getState().remainingSeconds).toBe(600);
  });

  test('handleSetIndefinite switches mode to indefinite', () => {
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'idle',
    });

    const { result } = renderHook(() => useTimerOrchestrator());

    act(() => {
      result.current.handleSetIndefinite();
    });

    expect(useTimerStore.getState().timerMode).toBe('indefinite');
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useTimerStore.getState().remainingSeconds).toBe(0);
  });
});
