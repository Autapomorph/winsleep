import { getHMS } from './getHMS';

describe('getHMS', () => {
  test('should return zeros for 0 seconds', () => {
    expect(getHMS(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  test('should calculate seconds correctly', () => {
    expect(getHMS(45)).toEqual({ hours: 0, minutes: 0, seconds: 45 });
  });

  test('should calculate minutes correctly', () => {
    expect(getHMS(125)).toEqual({ hours: 0, minutes: 2, seconds: 5 });
  });

  test('should calculate hours correctly', () => {
    expect(getHMS(3665)).toEqual({ hours: 1, minutes: 1, seconds: 5 });
  });

  test('should handle large values', () => {
    expect(getHMS(86400 + 3600 + 120 + 5)).toEqual({ hours: 25, minutes: 2, seconds: 5 });
  });
});
