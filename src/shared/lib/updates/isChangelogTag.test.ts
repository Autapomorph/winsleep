import { describe, expect, test } from 'vitest';

import { isChangelogTag } from './isChangelogTag';

describe('isChangelogTag', () => {
  test('returns true for valid changelog tags', () => {
    expect(isChangelogTag('new')).toBe(true);
    expect(isChangelogTag('improved')).toBe(true);
    expect(isChangelogTag('fixed')).toBe(true);
  });

  test('returns false for unknown or invalid values', () => {
    expect(isChangelogTag('unknown')).toBe(false);
    expect(isChangelogTag('NEW')).toBe(false);
    expect(isChangelogTag('')).toBe(false);
    expect(isChangelogTag(null)).toBe(false);
    expect(isChangelogTag(undefined)).toBe(false);
    expect(isChangelogTag(123)).toBe(false);
    expect(isChangelogTag({})).toBe(false);
  });
});
