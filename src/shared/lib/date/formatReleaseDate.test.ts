import { describe, expect, test } from 'vitest';

import { formatReleaseDate } from './formatReleaseDate';

describe('formatReleaseDate', () => {
  test('returns empty string when dateString is empty', () => {
    expect(formatReleaseDate('')).toBe('');
  });

  test('formats YYYY-MM-DD date without timezone shift', () => {
    const formattedEn = formatReleaseDate('2026-09-03', 'en-US');
    expect(formattedEn).toContain('September 3, 2026');

    const formattedRu = formatReleaseDate('2026-09-03', 'ru-RU');
    expect(formattedRu).toContain('3 сентября 2026');
  });

  test('formats full ISO string correctly', () => {
    const formatted = formatReleaseDate('2026-09-03T12:00:00Z', 'en-US');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('September');
  });

  test('returns original string if date is invalid', () => {
    expect(formatReleaseDate('invalid-date')).toBe('invalid-date');
  });

  test('respects custom options', () => {
    const formatted = formatReleaseDate('2026-09-03', 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    expect(formatted).toBe('09/03/2026');
  });
});
