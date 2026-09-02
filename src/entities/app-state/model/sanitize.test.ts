import { DEFAULT_SERIALIZED_APP_STATE, sanitizeAppState } from './sanitize';

describe('sanitizeAppState', () => {
  test('sanitizes valid active scheduled timer and version', () => {
    const raw = {
      version: 0,
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    };

    const result = sanitizeAppState(raw);
    expect(result).toEqual({
      version: 0,
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    });
  });

  test('falls back to default version when version is missing or invalid', () => {
    const raw = {
      scheduledTimer: null,
    };

    const result = sanitizeAppState(raw);
    expect(result).toEqual(DEFAULT_SERIALIZED_APP_STATE);
  });

  test('handles invalid or corrupted scheduledTimer', () => {
    expect(sanitizeAppState({ scheduledTimer: 'invalid' })).toEqual(DEFAULT_SERIALIZED_APP_STATE);

    expect(
      sanitizeAppState({
        scheduledTimer: {
          targetDateTime: 1700000000000,
          timerAction: 'invalid_action',
          armedAt: 1699990000000,
        },
      }),
    ).toEqual(DEFAULT_SERIALIZED_APP_STATE);

    expect(
      sanitizeAppState({
        scheduledTimer: {
          targetDateTime: -100,
          timerAction: 'sleep',
          armedAt: 1699990000000,
        },
      }),
    ).toEqual(DEFAULT_SERIALIZED_APP_STATE);
  });

  test('handles null or non-object input', () => {
    expect(sanitizeAppState(null as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_APP_STATE,
    );
    expect(sanitizeAppState(undefined as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_APP_STATE,
    );
    expect(sanitizeAppState('string' as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_APP_STATE,
    );
  });
});
