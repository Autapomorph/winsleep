import { type ActiveScheduledTimerState } from './appStateStore';
import { CURRENT_APP_STATE_VERSION } from './migrate';
import { serializeAppState } from './serialize';

describe('serializeAppState', () => {
  test('serializes app state with version and null fields', () => {
    const result = serializeAppState({ scheduledTimer: null, lastUpdateCheckAt: null });
    expect(result).toEqual({
      version: CURRENT_APP_STATE_VERSION,
      scheduledTimer: null,
      lastUpdateCheckAt: null,
    });
  });

  test('serializes app state with active scheduled timer and lastUpdateCheckAt', () => {
    const scheduledTimer: ActiveScheduledTimerState = {
      targetDateTime: 1700000000000,
      timerAction: 'shutdown',
      armedAt: 1699990000000,
    };

    const result = serializeAppState({ scheduledTimer, lastUpdateCheckAt: 1699995000000 });
    expect(result).toEqual({
      version: CURRENT_APP_STATE_VERSION,
      scheduledTimer,
      lastUpdateCheckAt: 1699995000000,
    });
  });
});
