import { deserializeAppState } from './deserialize';

describe('deserializeAppState', () => {
  test('deserializes valid active scheduled timer and lastUpdateCheckAt', () => {
    const raw = {
      version: 0,
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
      lastUpdateCheckAt: 1699995000000,
    };

    const result = deserializeAppState(raw);
    expect(result).toEqual({
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
      lastUpdateCheckAt: 1699995000000,
    });
  });

  test('deserializes null scheduledTimer and missing lastUpdateCheckAt', () => {
    const raw = {
      scheduledTimer: null,
    };

    const result = deserializeAppState(raw);
    expect(result).toEqual({ scheduledTimer: null, lastUpdateCheckAt: null });
  });

  test('handles corrupted or invalid fields gracefully', () => {
    const rawInvalidAction = {
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'unknown_action',
        armedAt: 1699990000000,
      },
      lastUpdateCheckAt: 'invalid',
    };
    expect(deserializeAppState(rawInvalidAction)).toEqual({
      scheduledTimer: null,
      lastUpdateCheckAt: null,
    });

    const rawEmpty = {};
    expect(deserializeAppState(rawEmpty)).toEqual({
      scheduledTimer: null,
      lastUpdateCheckAt: null,
    });
  });
});
