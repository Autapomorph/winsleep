import { DEFAULT_IS_LOCKED_BY_DEFAULT } from '@/shared/config';
import { useSessionStore } from './session.store';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      isInitialized: false,
      isLocked: DEFAULT_IS_LOCKED_BY_DEFAULT,
    });
  });

  test('should initialize with default state', () => {
    const state = useSessionStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.isLocked).toBe(DEFAULT_IS_LOCKED_BY_DEFAULT);
  });

  test('should set isInitialized', () => {
    useSessionStore.getState().setIsInitialized(true);
    expect(useSessionStore.getState().isInitialized).toBe(true);
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
