import { createMockT } from '@/tests/i18nMock';
import {
  formatDuration,
  formatDurationAbbr,
  formatDurationFull,
  formatDurationShort,
} from './formatDuration';

describe('formatDuration', () => {
  const mockT = createMockT({
    'common.time.units.hour.short': 'h',
    'common.time.units.hour.abbr': 'hr',
    'common.time.units.hour.full': 'hour',
    'common.time.units.minute.short': 'm',
    'common.time.units.minute.abbr': 'min',
    'common.time.units.minute.full': 'minute',
    'common.time.units.second.short': 's',
    'common.time.units.second.abbr': 'sec',
    'common.time.units.second.full': 'second',
  });

  test('should format 0 seconds correctly', () => {
    expect(formatDuration(0, mockT, 'short')).toBe('0s');
    expect(formatDuration(0, mockT, 'full')).toBe('0 second_plural_0');
  });

  test('should format short variant correctly', () => {
    expect(formatDuration(3665, mockT, 'short')).toBe('1h 1m 5s');
    expect(formatDuration(120, mockT, 'short')).toBe('2m');
    expect(formatDuration(45, mockT, 'short')).toBe('45s');
    expect(formatDurationShort(3665, mockT)).toBe('1h 1m 5s');
  });

  test('should format abbr variant correctly', () => {
    expect(formatDuration(3665, mockT, 'abbr')).toBe('1 hr_plural_1 1 min_plural_1 5 sec_plural_5');
    expect(formatDurationAbbr(3665, mockT)).toBe('1 hr_plural_1 1 min_plural_1 5 sec_plural_5');
  });

  test('should format full variant correctly', () => {
    expect(formatDuration(3665, mockT, 'full')).toBe(
      '1 hour_plural_1 1 minute_plural_1 5 second_plural_5',
    );
    expect(formatDurationFull(3665, mockT)).toBe(
      '1 hour_plural_1 1 minute_plural_1 5 second_plural_5',
    );
  });
});
