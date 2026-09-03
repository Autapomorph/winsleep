import { type ActiveScheduledTimerState, useAppStateStore } from './appStateStore';

describe('useAppStateStore', () => {
  beforeEach(() => {
    useAppStateStore.setState({ scheduledTimer: null });
  });

  test('sets active scheduled timer correctly', () => {
    const scheduledTimer: ActiveScheduledTimerState = {
      targetDateTime: 1700000000000,
      timerAction: 'sleep',
      armedAt: 1699990000000,
    };

    useAppStateStore.getState().setScheduledTimer(scheduledTimer);
    expect(useAppStateStore.getState().scheduledTimer).toEqual(scheduledTimer);
  });

  test('clears scheduled timer correctly', () => {
    const scheduledTimer: ActiveScheduledTimerState = {
      targetDateTime: 1700000000000,
      timerAction: 'sleep',
      armedAt: 1699990000000,
    };

    useAppStateStore.getState().setScheduledTimer(scheduledTimer);
    expect(useAppStateStore.getState().scheduledTimer).not.toBeNull();

    useAppStateStore.getState().clearScheduledTimer();
    expect(useAppStateStore.getState().scheduledTimer).toBeNull();
  });
});
