import { type ActiveScheduledTimerState } from './appStateStore';
import { CURRENT_APP_STATE_VERSION } from './migrate';
import { serializeAppState } from './serialize';

describe('serializeAppState', () => {
  test('serializes app state with version and scheduledTimer null', () => {
    const result = serializeAppState({ scheduledTimer: null });
    expect(result).toEqual({
      version: CURRENT_APP_STATE_VERSION,
      scheduledTimer: null,
    });
  });

  test('serializes app state with active scheduled timer', () => {
    const scheduledTimer: ActiveScheduledTimerState = {
      targetDateTime: 1700000000000,
      timerAction: 'shutdown',
      armedAt: 1699990000000,
    };

    const result = serializeAppState({ scheduledTimer });
    expect(result).toEqual({
      version: CURRENT_APP_STATE_VERSION,
      scheduledTimer,
    });
  });
});
