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

describe('timerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset state before each test to initial
    useTimerStore.setState({
      endTime: null,
      isListenersInitialized: false,
      plannedSeconds: DEFAULT_TIMER_SECONDS,
      remainingSeconds: DEFAULT_TIMER_SECONDS,
      targetDateTime: null,
      timerMode: 'duration',
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
    expect(state.timerMode).toBe('duration');
    expect(state.plannedSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(state.remainingSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(state.endTime).toBeNull();
    expect(state.targetDateTime).toBeNull();
  });

  test('should change exact time when idle', () => {
    useTimerStore.getState().setExactTime(120);

    expect(useTimerStore.getState().plannedSeconds).toBe(120);
    expect(useTimerStore.getState().remainingSeconds).toBe(120);
  });

  test('should increase and decrease time in duration mode', () => {
    const initial = useTimerStore.getState().plannedSeconds;

    useTimerStore.getState().increaseTime(60);
    expect(useTimerStore.getState().plannedSeconds).toBe(initial + 60);

    useTimerStore.getState().decreaseTime(30);
    expect(useTimerStore.getState().plannedSeconds).toBe(initial + 30);
  });

  test('should not increase or decrease time in indefinite or timestamp mode', () => {
    useTimerStore.setState({
      timerMode: 'indefinite',
      plannedSeconds: 0,
      remainingSeconds: 0,
    });

    useTimerStore.getState().increaseTime(60);
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useTimerStore.getState().remainingSeconds).toBe(0);

    useTimerStore.getState().decreaseTime(30);
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useTimerStore.getState().remainingSeconds).toBe(0);

    useTimerStore.setState({
      timerMode: 'timestamp',
      plannedSeconds: 300,
      remainingSeconds: 300,
    });

    useTimerStore.getState().increaseTime(60);
    expect(useTimerStore.getState().plannedSeconds).toBe(300);

    useTimerStore.getState().decreaseTime(30);
    expect(useTimerStore.getState().plannedSeconds).toBe(300);
  });

  test('should transition to running state when started', () => {
    useTimerStore.getState().setExactTime(10);
    useTimerStore.getState().start();

    const state = useTimerStore.getState();

    expect(state.timerState).toBe('running');
    expect(state.remainingSeconds).toBe(10);
    expect(state.endTime).toBeGreaterThan(0);
  });

  test('should tick down when tick received and reset on cancel', () => {
    useTimerStore.getState().setExactTime(3);
    useTimerStore.getState().start();

    // Advance mock time and trigger tick from backend
    vi.advanceTimersByTime(1000);
    triggerTick(2);
    expect(useTimerStore.getState().remainingSeconds).toBe(2);

    useTimerStore.getState().cancel();
    expect(useTimerStore.getState().remainingSeconds).toBe(3); // Resets to plannedSeconds on cancel
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('should ignore duplicate tick events with identical remainingSeconds', () => {
    useTimerStore.getState().setExactTime(10);
    useTimerStore.getState().start();

    triggerTick(9);
    expect(useTimerStore.getState().remainingSeconds).toBe(9);

    const subscriberSpy = vi.fn();
    const unsubscribe = useTimerStore.subscribe(subscriberSpy);

    // Trigger tick with the same value
    triggerTick(9);

    expect(subscriberSpy).not.toHaveBeenCalled();
    expect(useTimerStore.getState().remainingSeconds).toBe(9);

    // Trigger tick with different value
    triggerTick(8);
    expect(subscriberSpy).toHaveBeenCalledTimes(1);
    expect(useTimerStore.getState().remainingSeconds).toBe(8);

    unsubscribe();
  });

  test('should pause and resume ticking in duration mode', () => {
    useTimerStore.getState().setExactTime(5);
    useTimerStore.getState().start();

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

    // Resume the timer
    useTimerStore.getState().resume();
    expect(useTimerStore.getState().timerState).toBe('running');

    triggerTick(2);
    expect(useTimerStore.getState().remainingSeconds).toBe(2);
  });

  test('should not pause in indefinite or timestamp mode', () => {
    useTimerStore.setState({
      timerMode: 'indefinite',
      timerState: 'running',
    });

    useTimerStore.getState().pause();
    expect(useTimerStore.getState().timerState).toBe('running');

    useTimerStore.setState({
      timerMode: 'timestamp',
      timerState: 'running',
      endTime: Date.now() + 60000,
    });

    useTimerStore.getState().pause();
    expect(useTimerStore.getState().timerState).toBe('running');
  });

  test('should cancel timer and reset to idle', () => {
    useTimerStore.getState().setExactTime(10);
    useTimerStore.getState().start();

    vi.advanceTimersByTime(3000);
    triggerTick(7);
    expect(useTimerStore.getState().timerState).toBe('running');

    useTimerStore.getState().cancel();
    const state = useTimerStore.getState();

    expect(state.timerState).toBe('idle');
    expect(state.remainingSeconds).toBe(10);
    expect(state.endTime).toBeNull();
  });

  test('should ignore start when not in idle state', () => {
    useTimerStore.setState({ timerState: 'running' });
    useTimerStore.getState().start();

    expect(useTimerStore.getState().timerState).toBe('running');
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

  test('should retain paused state and update duration when setExactTime is called while paused', () => {
    useTimerStore.setState({
      endTime: null,
      plannedSeconds: 30,
      remainingSeconds: 30,
      timerMode: 'duration',
      timerState: 'paused',
    });
    useTimerStore.getState().setExactTime(120);

    const state = useTimerStore.getState();
    expect(state.timerState).toBe('paused');
    expect(state.timerMode).toBe('duration');
    expect(state.plannedSeconds).toBe(120);
    expect(state.remainingSeconds).toBe(120);
    expect(state.endTime).toBeNull();
  });

  test('should restore scheduled timer correctly', () => {
    const targetDateTime = Date.now() + 60000;

    useTimerStore.getState().restoreScheduledTimer(targetDateTime);

    const state = useTimerStore.getState();
    expect(state.timerState).toBe('running');
    expect(state.timerMode).toBe('timestamp');
    expect(state.targetDateTime).toBe(targetDateTime);
    expect(state.endTime).toBe(targetDateTime);
    expect(state.remainingSeconds).toBe(60);
  });

  test('should restore indefinite timer correctly', () => {
    useTimerStore.getState().restoreIndefiniteTimer();

    const state = useTimerStore.getState();
    expect(state.timerState).toBe('running');
    expect(state.timerMode).toBe('indefinite');
    expect(state.targetDateTime).toBeNull();
    expect(state.endTime).toBeNull();
    expect(state.plannedSeconds).toBe(0);
    expect(state.remainingSeconds).toBe(0);
  });

  test('should set indefinite mode from idle, running, and paused', () => {
    // 1. From idle
    useTimerStore.setState({ timerState: 'idle', timerMode: 'duration' });
    useTimerStore.getState().setIndefinite();

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(useTimerStore.getState().timerMode).toBe('indefinite');
    expect(useTimerStore.getState().plannedSeconds).toBe(0);
    expect(useTimerStore.getState().remainingSeconds).toBe(0);

    // 2. From running
    useTimerStore.setState({ timerState: 'running', timerMode: 'duration' });
    useTimerStore.getState().setIndefinite();

    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('indefinite');

    // 3. From paused
    useTimerStore.setState({ timerState: 'paused', timerMode: 'duration' });
    useTimerStore.getState().setIndefinite();

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(useTimerStore.getState().timerMode).toBe('indefinite');
  });

  test('should reset to default duration', () => {
    useTimerStore.setState({
      timerMode: 'indefinite',
      timerState: 'running',
      plannedSeconds: 0,
      remainingSeconds: 0,
    });

    useTimerStore.getState().resetToDefaultDuration();

    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(useTimerStore.getState().timerMode).toBe('duration');
    expect(useTimerStore.getState().plannedSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(useTimerStore.getState().remainingSeconds).toBe(DEFAULT_TIMER_SECONDS);
  });

  test('should handle mode transitions correctly', () => {
    // Paused duration -> timestamp: resets to idle
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'paused',
      remainingSeconds: 300,
    });
    useTimerStore.getState().setTimerMode('timestamp');
    expect(useTimerStore.getState().timerState).toBe('idle');
    expect(useTimerStore.getState().timerMode).toBe('timestamp');

    // Running duration -> timestamp: remains running
    useTimerStore.setState({
      timerMode: 'duration',
      timerState: 'running',
      remainingSeconds: 300,
    });
    useTimerStore.getState().setTimerMode('timestamp');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('timestamp');

    // Running timestamp -> duration: remains running
    useTimerStore.getState().setTimerMode('duration');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('duration');

    // Running duration -> indefinite: remains running
    useTimerStore.getState().setTimerMode('indefinite');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('indefinite');

    // Running indefinite -> duration: remains running
    useTimerStore.getState().setTimerMode('duration');
    expect(useTimerStore.getState().timerState).toBe('running');
    expect(useTimerStore.getState().timerMode).toBe('duration');
  });
});
