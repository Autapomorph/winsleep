import { deserializeSettings } from './deserialize';

describe('deserializeSettings', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-1234-1234-1234567890ab');
  });

  test('correctly deserializes and sanitizes settings state', () => {
    const raw = {
      defaultTimerSeconds: 300,
      customTimerPresets: [60, 120],
      notificationTimes: [30],
    };

    const state = deserializeSettings(raw);

    expect(state.defaultTimerSeconds).toBe(300);
    expect(state.customTimerPresets).toEqual([
      {
        id: '12345678-1234-1234-1234-1234567890ab',
        seconds: 60,
      },
      {
        id: '12345678-1234-1234-1234-1234567890ab',
        seconds: 120,
      },
    ]);
    expect(state.notificationTimes).toEqual([
      {
        id: '12345678-1234-1234-1234-1234567890ab',
        seconds: 30,
      },
    ]);
  });
});
