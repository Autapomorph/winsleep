import { describe, expect, test } from 'vitest';

import { isReleaseNotesTag } from './isReleaseNotesTag';

describe('isReleaseNotesTag', () => {
  test('returns true for valid release notes tags', () => {
    expect(isReleaseNotesTag('new')).toBe(true);
    expect(isReleaseNotesTag('improved')).toBe(true);
    expect(isReleaseNotesTag('fixed')).toBe(true);
  });

  test('returns false for unknown or invalid values', () => {
    expect(isReleaseNotesTag('unknown')).toBe(false);
    expect(isReleaseNotesTag('NEW')).toBe(false);
    expect(isReleaseNotesTag('')).toBe(false);
    expect(isReleaseNotesTag(null)).toBe(false);
    expect(isReleaseNotesTag(undefined)).toBe(false);
    expect(isReleaseNotesTag(123)).toBe(false);
    expect(isReleaseNotesTag({})).toBe(false);
  });
});
