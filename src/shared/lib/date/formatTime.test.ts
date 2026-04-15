import { formatTime } from './formatTime';

describe('formatTime', () => {
  test('should format 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  test('should format only seconds correctly (e.g. 5s -> 0:05)', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  test('should format minutes and seconds correctly (e.g. 65s -> 1:05)', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  test('should format hours correctly (e.g. 3665s -> 1:01:05)', () => {
    expect(formatTime(3665)).toBe('1:01:05');
  });

  test('should format multiple hours correctly (e.g. 7200s -> 2:00:00)', () => {
    expect(formatTime(7200)).toBe('2:00:00');
  });

  test('should ceil float seconds to nearest integer', () => {
    expect(formatTime(5.1)).toBe('0:06');
    expect(formatTime(5.9)).toBe('0:06');
    expect(formatTime(0.001)).toBe('0:01');
  });
});
