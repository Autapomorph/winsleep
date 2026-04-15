import { isValidUpdateInterval } from './isValidUpdateInterval';

describe('isValidUpdateInterval', () => {
  test('should return true for valid update intervals', () => {
    expect(isValidUpdateInterval('startup')).toBe(true);
    expect(isValidUpdateInterval(1)).toBe(true);
    expect(isValidUpdateInterval(24)).toBe(true);
  });

  test('should return false for invalid update intervals', () => {
    expect(isValidUpdateInterval('daily')).toBe(false);
    expect(isValidUpdateInterval('weekly')).toBe(false);
    expect(isValidUpdateInterval(null)).toBe(false);
    expect(isValidUpdateInterval(123)).toBe(false);
  });
});
