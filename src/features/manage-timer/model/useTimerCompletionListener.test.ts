import { renderHook } from '@testing-library/react';

import { useTimerStore } from '@/entities/timer';
import { useTimerCompletionListener } from './useTimerCompletionListener';

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

const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('./useTimerExecution', () => ({
  useTimerExecution: () => ({
    execute: mockExecute,
  }),
}));

describe('useTimerCompletionListener', () => {
  beforeEach(() => {
    Object.keys(mockListeners).forEach(key => {
      delete mockListeners[key];
    });
    mockExecute.mockClear();

    useTimerStore.setState({
      timerState: 'idle',
    });
  });

  test('subscribes to timer-complete on mount and unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useTimerCompletionListener());

    expect(mockListeners['timer-complete']).toBeDefined();

    unmount();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockListeners['timer-complete']).toBeUndefined();
  });

  test('executes action and cancels timer when timer-complete fires and timer is running', () => {
    useTimerStore.setState({
      timerState: 'running',
    });

    renderHook(() => useTimerCompletionListener());

    mockListeners['timer-complete']({ payload: null });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(useTimerStore.getState().timerState).toBe('idle');
  });

  test('does not execute action when timer-complete fires but timer is idle', () => {
    useTimerStore.setState({
      timerState: 'idle',
    });

    renderHook(() => useTimerCompletionListener());

    mockListeners['timer-complete']({ payload: null });

    expect(mockExecute).not.toHaveBeenCalled();
  });
});
