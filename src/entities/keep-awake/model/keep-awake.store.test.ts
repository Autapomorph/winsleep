import { act } from '@testing-library/react';

import { useKeepAwakeStore } from './keep-awake.store';

describe('useKeepAwakeStore', () => {
  beforeEach(() => {
    act(() => {
      useKeepAwakeStore.setState({
        isIndefiniteActive: false,
        startedAt: null,
      });
    });
  });

  test('should initialize with default state', () => {
    const state = useKeepAwakeStore.getState();
    expect(state.isIndefiniteActive).toBe(false);
    expect(state.startedAt).toBeNull();
  });

  test('should start indefinite keep-awake', () => {
    const beforeTime = Date.now();
    act(() => {
      useKeepAwakeStore.getState().startIndefinite();
    });

    const state = useKeepAwakeStore.getState();
    expect(state.isIndefiniteActive).toBe(true);
    expect(state.startedAt).toBeGreaterThanOrEqual(beforeTime);
  });

  test('should stop indefinite keep-awake', () => {
    act(() => {
      useKeepAwakeStore.getState().startIndefinite();
    });
    expect(useKeepAwakeStore.getState().isIndefiniteActive).toBe(true);

    act(() => {
      useKeepAwakeStore.getState().stopIndefinite();
    });

    const state = useKeepAwakeStore.getState();
    expect(state.isIndefiniteActive).toBe(false);
    expect(state.startedAt).toBeNull();
  });
});
