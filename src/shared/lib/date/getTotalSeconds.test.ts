import { getTotalSeconds } from './getTotalSeconds';

describe('getTotalSeconds', () => {
  test('should return 0 when all inputs are 0', () => {
    expect(getTotalSeconds(0, 0, 0)).toBe(0);
  });

  test('should convert hours, minutes, and seconds correctly', () => {
    expect(getTotalSeconds(1, 1, 5)).toBe(3665);
  });

  test('should handle only seconds', () => {
    expect(getTotalSeconds(0, 0, 45)).toBe(45);
  });

  test('should handle only minutes', () => {
    expect(getTotalSeconds(0, 5, 0)).toBe(300);
  });

  test('should handle only hours', () => {
    expect(getTotalSeconds(3, 0, 0)).toBe(10800);
  });
});
