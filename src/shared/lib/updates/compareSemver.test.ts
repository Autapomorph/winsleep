import { describe, expect, test } from 'vitest';

import { compareSemver, compareSemverDesc } from './compareSemver';

describe('compareSemver', () => {
  const versions = ['1.0.0', '1.2.0', '1.1.5', '2.0.0', '1.1.0'];

  test('defaults to descending order', () => {
    const sorted = [...versions].sort((a, b) => compareSemver(a, b));
    expect(sorted).toEqual(['2.0.0', '1.2.0', '1.1.5', '1.1.0', '1.0.0']);
  });

  test('sorts in ascending order when requested via string argument', () => {
    const sorted = [...versions].sort((a, b) => compareSemver(a, b, 'asc'));
    expect(sorted).toEqual(['1.0.0', '1.1.0', '1.1.5', '1.2.0', '2.0.0']);
  });

  test('sorts in ascending order when requested via options object', () => {
    const sorted = [...versions].sort((a, b) => compareSemver(a, b, { direction: 'asc' }));
    expect(sorted).toEqual(['1.0.0', '1.1.0', '1.1.5', '1.2.0', '2.0.0']);
  });

  test('handles "v" prefix correctly', () => {
    expect(compareSemver('v1.2.0', '1.1.0')).toBeLessThan(0);
    expect(compareSemver('1.1.0', 'v1.2.0')).toBeGreaterThan(0);
    expect(compareSemver('v1.2.0', 'v1.2.0')).toBe(0);

    expect(compareSemver('v1.2.0', '1.1.0', 'asc')).toBeGreaterThan(0);
    expect(compareSemver('1.1.0', 'v1.2.0', 'asc')).toBeLessThan(0);
  });

  test('compares minor and patch versions correctly', () => {
    expect(compareSemver('1.2.1', '1.2.0')).toBeLessThan(0);
    expect(compareSemver('1.2.0', '1.2.1')).toBeGreaterThan(0);
    expect(compareSemver('1.10.0', '1.2.0')).toBeLessThan(0);
  });

  test('pins specified version to top in descending order', () => {
    const list = ['1.2.0', 'X.Y.Z', '1.1.0'];
    const sorted = [...list].sort((a, b) => compareSemver(a, b, { pinnedTop: 'X.Y.Z' }));
    expect(sorted).toEqual(['X.Y.Z', '1.2.0', '1.1.0']);
  });

  test('pins specified version to top in ascending order', () => {
    const list = ['1.2.0', 'X.Y.Z', '1.1.0'];
    const sorted = [...list].sort((a, b) =>
      compareSemver(a, b, { direction: 'asc', pinnedTop: 'X.Y.Z' }),
    );
    expect(sorted).toEqual(['X.Y.Z', '1.1.0', '1.2.0']);
  });

  test('handles equal pinned versions', () => {
    expect(compareSemver('X.Y.Z', 'X.Y.Z', { pinnedTop: 'X.Y.Z' })).toBe(0);
  });

  test('compareSemverDesc alias works correctly', () => {
    const sorted = [...versions].sort((a, b) => compareSemverDesc(a, b));
    expect(sorted).toEqual(['2.0.0', '1.2.0', '1.1.5', '1.1.0', '1.0.0']);
  });
});
