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

  test('sanitizes valid indefinite keep-awake scheduled timer object', () => {
    const valid = {
      targetDateTime: null,
      timerAction: 'keep-awake',
      armedAt: 1699990000000,
    };

    expect(sanitizeScheduledTimer(valid)).toEqual({
      targetDateTime: null,
      timerAction: 'keep-awake',
      armedAt: 1699990000000,
    });
  });

  test('sanitizes valid negative timestamps (dates prior to Unix epoch 1970)', () => {
    const valid = {
      targetDateTime: -10000,
      timerAction: 'sleep',
      armedAt: -50000,
    };

    expect(sanitizeScheduledTimer(valid)).toEqual({
      targetDateTime: -10000,
      timerAction: 'sleep',
      armedAt: -50000,
    });
  });

  test('returns null for null, undefined or non-object inputs', () => {
    expect(sanitizeScheduledTimer(null)).toBeNull();
    expect(sanitizeScheduledTimer(undefined)).toBeNull();
    expect(sanitizeScheduledTimer('string')).toBeNull();
    expect(sanitizeScheduledTimer(123)).toBeNull();
  });

  test('returns null when targetDateTime is null for non-keep-awake actions', () => {
    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'shutdown',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'hibernate',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'reboot',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'lock',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: null,
        timerAction: 'sign-out',
        armedAt: 1699990000000,
      }),
    ).toBeNull();
  });

  test('returns null for missing or invalid properties', () => {
    expect(
      sanitizeScheduledTimer({
        targetDateTime: Number.NaN,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      }),
    ).toBeNull();

    expect(
      sanitizeScheduledTimer({
        targetDateTime: Number.POSITIVE_INFINITY,
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
        armedAt: Number.NaN,
      }),
    ).toBeNull();

    expect(sanitizeScheduledTimer({})).toBeNull();
  });
});
