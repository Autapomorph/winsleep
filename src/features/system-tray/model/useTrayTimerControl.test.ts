import { renderHook } from '@testing-library/react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { useTrayTimerControl } from './useTrayTimerControl';

const mockListeners: Record<string, (event: { payload: unknown }) => void> = {};

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn((event, callback) => {
    mockListeners[event] = callback;
    return Promise.resolve(() => {
      delete mockListeners[event];
    });
  }),
}));

describe('useTrayTimerControl', () => {
  beforeEach(() => {
    Object.keys(mockListeners).forEach(key => {
      delete mockListeners[key];
    });

    useTimerStore.setState({
      timerState: 'idle',
      onCompleteCallback: undefined,
    });

    useSettingsStore.setState({
      isCustomTimerStepsEnabled: false,
    });

    useSessionStore.setState({
      isLocked: false,
    });
  });

  test('subscribes to all tray events on mount', () => {
    renderHook(() => useTrayTimerControl());

    expect(mockListeners['tray-timer-start-resume-pause-clicked']).toBeDefined();
    expect(mockListeners['tray-timer-cancel-clicked']).toBeDefined();
    expect(mockListeners['tray-timer-increase-clicked']).toBeDefined();
    expect(mockListeners['tray-timer-decrease-clicked']).toBeDefined();
    expect(mockListeners['tray-preset-selected']).toBeDefined();
    expect(mockListeners['tray-settings-lock-toggle-clicked']).toBeDefined();
  });

  test('unsubscribes from all tray events on unmount', async () => {
    const { unmount } = renderHook(() => useTrayTimerControl());

    expect(Object.keys(mockListeners).length).toBeGreaterThan(0);

    unmount();

    // We need to wait for Promise.all(unlistenPromises) resolving and calling unlisteners inside useEffect cleanup
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(Object.keys(mockListeners).length).toBe(0);
  });

  test('handles timer start resume pause events', () => {
    const onComplete = vi.fn();

    useTimerStore.setState({
      timerState: 'idle',
      plannedSeconds: 300,
      onCompleteCallback: onComplete,
    });

    renderHook(() => useTrayTimerControl());

    // idle → start
    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('running');

    // running → pause
    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('paused');

    // paused → resume
    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('handles timer cancel event', () => {
    const onComplete = vi.fn();
    useTimerStore.setState({
      timerState: 'running',
      plannedSeconds: 300,
      onCompleteCallback: onComplete,
    });

    renderHook(() => useTrayTimerControl());

    mockListeners['tray-timer-cancel-clicked']({ payload: null });

    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('ignores pause, resume, and cancel events from tray when settings are locked', () => {
    const onComplete = vi.fn();

    useSessionStore.setState({ isLocked: true });

    // Idle state: start should be permitted
    useTimerStore.setState({
      timerState: 'idle',
      plannedSeconds: 300,
      onCompleteCallback: onComplete,
    });

    renderHook(() => useTrayTimerControl());

    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('running');

    // Running state: pause should be ignored when locked
    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('running');

    // Cancel should be ignored when locked
    mockListeners['tray-timer-cancel-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('running');

    // Paused state: resume should be ignored when locked
    useTimerStore.setState({ timerState: 'paused' });
    mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });
    expect(useTimerStore.getState().timerState).toBe('paused');
  });

  test('handles timer time adjustments', () => {
    useTimerStore.setState({
      timerState: 'idle',
      plannedSeconds: 300,
      remainingSeconds: 300,
    });

    renderHook(() => useTrayTimerControl());

    mockListeners['tray-timer-increase-clicked']({ payload: null });
    expect(useTimerStore.getState().plannedSeconds).toBe(330);

    mockListeners['tray-timer-decrease-clicked']({ payload: null });
    expect(useTimerStore.getState().plannedSeconds).toBe(300);
  });

  test('handles preset selected event', () => {
    useTimerStore.setState({ timerState: 'idle' });

    renderHook(() => useTrayTimerControl());

    mockListeners['tray-preset-selected']({ payload: 600 });

    expect(useTimerStore.getState().plannedSeconds).toBe(600);
    expect(useTimerStore.getState().remainingSeconds).toBe(600);
  });

  test('handles lock toggle event', () => {
    useSessionStore.setState({ isLocked: false });

    renderHook(() => useTrayTimerControl());

    mockListeners['tray-settings-lock-toggle-clicked']({ payload: null });

    expect(useSessionStore.getState().isLocked).toBe(true);
  });

  describe('keep-awake indefinite mode', () => {
    beforeEach(() => {
      useKeepAwakeStore.setState({ isIndefiniteActive: false });
      useSessionStore.setState({ timerAction: 'keep-awake' });
      useTimerStore.setState({
        timerState: 'idle',
        plannedSeconds: 0,
        remainingSeconds: 0,
        timerMode: 'duration',
      });
    });

    test('starts indefinite keep-awake instead of 0s timer when action is keep-awake and plannedSeconds is 0', () => {
      const onComplete = vi.fn();
      useTimerStore.setState({ onCompleteCallback: onComplete });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
      expect(useTimerStore.getState().timerState).toBe('idle');
      expect(onComplete).not.toHaveBeenCalled();
    });

    test('ignores start/resume/pause click while indefinite is active since pause is disabled', () => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-timer-start-resume-pause-clicked']({ payload: null });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
    });

    test('stops indefinite keep-awake when cancel is clicked', () => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-timer-cancel-clicked']({ payload: null });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
    });

    test('stops indefinite keep-awake and starts timer when a positive preset is selected', () => {
      const onComplete = vi.fn();
      useTimerStore.setState({ onCompleteCallback: onComplete });
      useKeepAwakeStore.setState({ isIndefiniteActive: true });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-preset-selected']({ payload: 600 });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
      expect(useTimerStore.getState().plannedSeconds).toBe(600);
      expect(useTimerStore.getState().timerState).toBe('running');
    });

    test('switches running countdown to indefinite keep-awake when preset 0 is selected', () => {
      const onComplete = vi.fn();
      useTimerStore.setState({
        timerState: 'running',
        plannedSeconds: 600,
        remainingSeconds: 300,
        onCompleteCallback: onComplete,
      });
      useKeepAwakeStore.setState({ isIndefiniteActive: false });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-preset-selected']({ payload: 0 });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);
      expect(useTimerStore.getState().timerState).toBe('idle');
      expect(useTimerStore.getState().plannedSeconds).toBe(0);
      expect(onComplete).not.toHaveBeenCalled();
    });

    test('cancels paused countdown and sets idle when preset 0 is selected in keep-awake', () => {
      const onComplete = vi.fn();
      useSessionStore.setState({ timerAction: 'keep-awake' });
      useTimerStore.setState({
        timerState: 'paused',
        plannedSeconds: 600,
        remainingSeconds: 300,
        onCompleteCallback: onComplete,
      });
      useKeepAwakeStore.setState({ isIndefiniteActive: false });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-preset-selected']({ payload: 0 });

      expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(false);
      expect(useTimerStore.getState().timerState).toBe('idle');
      expect(useTimerStore.getState().plannedSeconds).toBe(0);
      expect(onComplete).not.toHaveBeenCalled();
    });

    test('ignores increase and decrease clicks while indefinite is active', () => {
      useKeepAwakeStore.setState({ isIndefiniteActive: true });
      useTimerStore.setState({ plannedSeconds: 0 });

      renderHook(() => useTrayTimerControl());

      mockListeners['tray-timer-increase-clicked']({ payload: null });
      expect(useTimerStore.getState().plannedSeconds).toBe(0);

      mockListeners['tray-timer-decrease-clicked']({ payload: null });
      expect(useTimerStore.getState().plannedSeconds).toBe(0);
    });
  });
});
