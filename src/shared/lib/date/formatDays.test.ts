import type { TFunction } from 'i18next';

import { SECONDS_IN_DAY } from '@/shared/config';
import { formatDays } from './formatDays';

describe('formatDays', () => {
  const tMock = (() => 'days') as unknown as TFunction;

  test('should return null if seconds < SECONDS_IN_DAY', () => {
    expect(formatDays(SECONDS_IN_DAY - 1, tMock)).toBeNull();
    expect(formatDays(3600, tMock)).toBeNull();
  });

  test('should format days correctly if seconds >= SECONDS_IN_DAY', () => {
    expect(formatDays(SECONDS_IN_DAY, tMock)).toBe('1 days');
    expect(formatDays(SECONDS_IN_DAY * 2, tMock)).toBe('2 days');
  });
});
