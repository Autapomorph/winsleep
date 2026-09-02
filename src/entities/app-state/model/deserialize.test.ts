import { deserializeAppState } from './deserialize';

describe('deserializeAppState', () => {
  test('deserializes valid active scheduled timer', () => {
    const raw = {
      version: 0,
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    };

    const result = deserializeAppState(raw);
    expect(result).toEqual({
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    });
  });

  test('deserializes null scheduledTimer', () => {
    const raw = {
      scheduledTimer: null,
    };

    const result = deserializeAppState(raw);
    expect(result).toEqual({ scheduledTimer: null });
  });

  test('handles corrupted or invalid fields gracefully', () => {
    const rawInvalidAction = {
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'unknown_action',
        armedAt: 1699990000000,
      },
    };
    expect(deserializeAppState(rawInvalidAction)).toEqual({ scheduledTimer: null });

    const rawEmpty = {};
    expect(deserializeAppState(rawEmpty)).toEqual({ scheduledTimer: null });
  });
});
