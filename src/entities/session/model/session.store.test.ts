import { DEFAULT_TIMER_ACTION } from '@/shared/config';
import { useSessionStore } from './session.store';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      isInitialized: false,
      isLocked: false,
      timerAction: DEFAULT_TIMER_ACTION,
    });
  });

  test('should initialize with default state', () => {
    const state = useSessionStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.timerAction).toBe(DEFAULT_TIMER_ACTION);
    expect(state.isLocked).toBe(false);
  });

  test('should set isInitialized', () => {
    useSessionStore.getState().setIsInitialized(true);
    expect(useSessionStore.getState().isInitialized).toBe(true);
  });

  test('should set timerAction', () => {
    useSessionStore.getState().setTimerAction('shutdown');
    expect(useSessionStore.getState().timerAction).toBe('shutdown');
  });

  test('should set isLocked', () => {
    useSessionStore.getState().setIsLocked(true);
    expect(useSessionStore.getState().isLocked).toBe(true);
  });

  test('should toggleLock', () => {
    useSessionStore.getState().toggleLock();
    expect(useSessionStore.getState().isLocked).toBe(true);

    useSessionStore.getState().toggleLock();
    expect(useSessionStore.getState().isLocked).toBe(false);
  });
});
