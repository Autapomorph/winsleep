import { migrateAppState } from './migrate';

describe('migrateAppState', () => {
  test('migrates app state correctly and strips version', () => {
    const data = {
      version: 0,
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    };

    const res = migrateAppState(data);

    expect(res.version).toBe(0);
    expect(res.state).toEqual({
      scheduledTimer: {
        targetDateTime: 1700000000000,
        timerAction: 'sleep',
        armedAt: 1699990000000,
      },
    });
    expect(res.state.version).toBeUndefined();
  });

  test('defaults to version 0 if no version property exists', () => {
    const data = {
      scheduledTimer: null,
    };

    const res = migrateAppState(data);

    expect(res.version).toBe(0);
    expect(res.state).toEqual({ scheduledTimer: null });
  });
});
