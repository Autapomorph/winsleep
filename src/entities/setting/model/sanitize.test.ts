import { DEFAULT_TIMER_ACTION, DEFAULT_TIMER_SECONDS } from '@/shared/config';
import { CURRENT_SETTINGS_VERSION } from './migrate';
import { DEFAULT_SERIALIZED_SETTINGS, sanitizeSettings } from './sanitize';

describe('sanitizeSettings', () => {
  test('should return default settings for null or non-object input', () => {
    expect(sanitizeSettings(null as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_SETTINGS,
    );
    expect(sanitizeSettings(undefined as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_SETTINGS,
    );
    expect(sanitizeSettings('string' as unknown as Record<string, unknown>)).toEqual(
      DEFAULT_SERIALIZED_SETTINGS,
    );
  });

  test('should use default values for empty input', () => {
    const sanitized = sanitizeSettings({});

    expect(sanitized.version).toBe(CURRENT_SETTINGS_VERSION);
    expect(sanitized.defaultTimerAction).toBe(DEFAULT_TIMER_ACTION);
    expect(sanitized.defaultTimerSeconds).toBe(DEFAULT_TIMER_SECONDS);
  });

  test('should preserve valid values', () => {
    const raw = {
      version: 5,
      defaultTimerAction: 'shutdown',
      defaultTimerSeconds: 600,
      isNotificationsEnabled: false,
    };

    const sanitized = sanitizeSettings(raw);

    expect(sanitized.version).toBe(5);
    expect(sanitized.defaultTimerAction).toBe('shutdown');
    expect(sanitized.defaultTimerSeconds).toBe(600);
    expect(sanitized.isNotificationsEnabled).toBe(false);
  });

  test('should fallback to defaults when values are invalid types', () => {
    const raw = {
      defaultTimerAction: 123,
      defaultTimerSeconds: -10,
      isNotificationsEnabled: 'yes',
    };

    const sanitized = sanitizeSettings(raw);

    expect(sanitized.defaultTimerAction).toBe(DEFAULT_TIMER_ACTION);
    expect(sanitized.defaultTimerSeconds).toBe(DEFAULT_TIMER_SECONDS);
    expect(sanitized.isNotificationsEnabled).toBe(true);
  });

  test('should sanitize notificationTimes array', () => {
    const raw = {
      notificationTimes: [10, '60', 'invalid', -5],
    };

    const sanitized = sanitizeSettings(raw);

    expect(sanitized.notificationTimes).toEqual([10, 60, 60, 60]);
  });

  test('should sanitize customTimerPresets array', () => {
    const raw = {
      customTimerPresets: [
        60,
        { seconds: 120 },
        { seconds: 'invalid' },
        '180',
        null,
        {},
        { other: 5 },
      ],
    };

    const sanitized = sanitizeSettings(raw);

    expect(sanitized.customTimerPresets).toEqual([60, 120, 0, 180, 0, 0, 0]);
  });
});
