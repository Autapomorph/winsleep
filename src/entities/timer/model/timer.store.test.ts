import { DEFAULT_TIMER_SECONDS } from '@/shared/config';
import { initTimerListeners } from './initTimerListeners';
import { useTimerStore } from './timer.store';

const mockListeners: Record<string, ((event: { payload: unknown }) => void)[]> = {};

vi.mock('@/shared/api', () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
  typedListen: vi.fn((event, callback) => {
    if (!mockListeners[event]) {
      mockListeners[event] = [];
    }
    mockListeners[event].push(callback);
    return Promise.resolve(() => {
      mockListeners[event] = mockListeners[event].filter(cb => cb !== callback);
    });
  }),
}));

const triggerTick = (seconds: number) => {
  mockListeners['timer-tick']?.forEach(cb => cb({ payload: seconds }));
};

const triggerComplete = () => {
  mockListeners['timer-complete']?.forEach(cb => cb({ payload: undefined }));
};

describe('timerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset state before each test to initial
    useTimerStore.setState({
      endTime: null,
      isListenersInitialized: false,
      onCompleteCallback: null,
      plannedSeconds: DEFAULT_TIMER_SECONDS,
      remainingSeconds: DEFAULT_TIMER_SECONDS,
      timeoutId: null,
      timerState: 'idle',
    });
    initTimerListeners();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should initialize with default state', () => {
    const state = useTimerStore.getState();

    expect(state.timerState).toBe('idle');
    expect(state.plannedSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(state.remainingSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(state.endTime).toBeNull();
  });

  test('should change exact time when idle', () => {
    useTimerStore.getState().setExactTime(120);

    expect(useTimerStore.getState().plannedSeconds).toBe(120);
    expect(useTimerStore.getState().remainingSeconds).toBe(120);
  });

  test('should increase and decrease time', () => {
    const initial = useTimerStore.getState().plannedSeconds;

    useTimerStore.getState().increaseTime(60);
    expect(useTimerStore.getState().plannedSeconds).toBe(initial + 60);

    useTimerStore.getState().decreaseTime(30);
    expect(useTimerStore.getState().plannedSeconds).toBe(initial + 30);
  });

  test('should transition to running state when started', () => {
    const onComplete = vi.fn();
    useTimerStore.getState().setExactTime(10);
    useTimerStore.getState().start(onComplete);

    const state = useTimerStore.getState();

    expect(state.timerState).toBe('running');
    expect(state.remainingSeconds).toBe(10);
    expect(state.endTime).toBeGreaterThan(0);
  });

  test('should tick down and call onComplete when finished', () => {
    const onComplete = vi.fn();
    useTimerStore.getState().setExactTime(3);
    useTimerStore.getState().start(onComplete);

    // Advance mock time and trigger tick from backend
    vi.advanceTimersByTime(1000);
    triggerTick(2);
    expect(useTimerStore.getState().remainingSeconds).toBe(2);

    // Simulate completion
    triggerComplete();
    expect(useTimerStore.getState().remainingSeconds).toBe(3); // Resets to plannedSeconds on completion
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('should pause and resume ticking', () => {
    const onComplete = vi.fn();
    useTimerStore.getState().setExactTime(5);
    useTimerStore.getState().start(onComplete);

    // Advance mock time and trigger tick from backend
    vi.advanceTimersByTime(2000);
    triggerTick(3);
    expect(useTimerStore.getState().remainingSeconds).toBe(3);

    // Pause the timer
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().timerState).toBe('paused');

    // Ticks received while paused should not affect it
    triggerTick(2);
    expect(useTimerStore.getState().remainingSeconds).toBe(3);
    expect(onComplete).not.toHaveBeenCalled();

    // Resume the timer
    useTimerStore.getState().resume(onComplete);
    expect(useTimerStore.getState().timerState).toBe('running');

    // Simulate completion
    triggerComplete();
    expect(useTimerStore.getState().remainingSeconds).toBe(5); // Resets to plannedSeconds on completion
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('should cancel timer and reset to idle', () => {
    const onComplete = vi.fn();
    useTimerStore.getState().setExactTime(10);
    useTimerStore.getState().start(onComplete);

    vi.advanceTimersByTime(3000);
    triggerTick(7);
    expect(useTimerStore.getState().timerState).toBe('running');

    useTimerStore.getState().cancel();
    const state = useTimerStore.getState();

    expect(state.timerState).toBe('idle');
    expect(state.remainingSeconds).toBe(10);
    expect(state.endTime).toBeNull();
    expect(state.timeoutId).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('should ignore start when not in idle state', () => {
    const onComplete = vi.fn();
    useTimerStore.setState({ timerState: 'running' });
    useTimerStore.getState().start(onComplete);

    expect(onComplete).not.toHaveBeenCalled();
  });

  test('should ignore pause when not in running state or no endTime', () => {
    useTimerStore.setState({ endTime: null, timerState: 'idle' });
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().timerState).toBe('idle');

    useTimerStore.setState({ endTime: null, timerState: 'running' });
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('should set exact remaining time when not in idle state', () => {
    useTimerStore.setState({ endTime: Date.now(), timerState: 'running' });
    useTimerStore.getState().setExactTime(60);

    expect(useTimerStore.getState().remainingSeconds).toBe(60);
    expect(useTimerStore.getState().endTime).toBeGreaterThan(Date.now());
  });

  test('should restore scheduled timer correctly', () => {
    const onComplete = vi.fn();
    const targetDateTime = Date.now() + 60000;

    useTimerStore.getState().restoreScheduledTimer(targetDateTime, onComplete);

    const state = useTimerStore.getState();
    expect(state.timerState).toBe('running');
    expect(state.timerMode).toBe('timestamp');
    expect(state.targetDateTime).toBe(targetDateTime);
    expect(state.endTime).toBe(targetDateTime);
    expect(state.remainingSeconds).toBe(60);
  });
});
