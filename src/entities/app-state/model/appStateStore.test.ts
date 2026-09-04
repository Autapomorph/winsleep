import { type ActiveScheduledTimerState, useAppStateStore } from './appStateStore';

describe('useAppStateStore', () => {
  beforeEach(() => {
    useAppStateStore.setState({
      scheduledTimer: null,
      lastUpdateCheckAt: null,
    });
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

  test('sets and updates lastUpdateCheckAt correctly', () => {
    expect(useAppStateStore.getState().lastUpdateCheckAt).toBeNull();

    const timestamp = 1700000000000;
    useAppStateStore.getState().setLastUpdateCheckAt(timestamp);
    expect(useAppStateStore.getState().lastUpdateCheckAt).toBe(timestamp);

    useAppStateStore.getState().setLastUpdateCheckAt(null);
    expect(useAppStateStore.getState().lastUpdateCheckAt).toBeNull();
  });
});
