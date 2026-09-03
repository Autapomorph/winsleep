import { sanitizeScheduledTimer } from './scheduledTimer';

describe('sanitizeScheduledTimer', () => {
  test('sanitizes valid active scheduled timer object', () => {
    const valid = {
      targetDateTime: 1700000000000,
      timerAction: 'sleep',
      armedAt: 1699990000000,
    };

    expect(sanitizeScheduledTimer(valid)).toEqual({
      targetDateTime: 1700000000000,
      timerAction: 'sleep',
      armedAt: 1699990000000,
    });
  });

  test('returns null for null, undefined or non-object inputs', () => {
    expect(sanitizeScheduledTimer(null)).toBeNull();
    expect(sanitizeScheduledTimer(undefined)).toBeNull();
    expect(sanitizeScheduledTimer('string')).toBeNull();
    expect(sanitizeScheduledTimer(123)).toBeNull();
  });

  test('returns null for missing or invalid properties', () => {
    expect(
      sanitizeScheduledTimer({
        targetDateTime: -1,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: 1700000000000,
        timerAction: 'invalid_action',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 0,
      }),
    ).toBeNull();

    expect(sanitizeScheduledTimer({})).toBeNull();
  });
});
