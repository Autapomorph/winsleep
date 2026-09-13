import { isValidTimerAction } from './isValidTimerAction';

describe('isValidTimerAction', () => {
  test('should return true for valid action names', () => {
    expect(isValidTimerAction('sleep')).toBe(true);
    expect(isValidTimerAction('hibernate')).toBe(true);
    expect(isValidTimerAction('shutdown')).toBe(true);
    expect(isValidTimerAction('reboot')).toBe(true);
    expect(isValidTimerAction('lock')).toBe(true);
    expect(isValidTimerAction('signout')).toBe(true);
    expect(isValidTimerAction('keep-awake')).toBe(true);
  });

  test('should return false for invalid action names', () => {
    expect(isValidTimerAction('invalid')).toBe(false);
    expect(isValidTimerAction('')).toBe(false);
  });

  test('should return false for non-string types', () => {
    expect(isValidTimerAction(null)).toBe(false);
    expect(isValidTimerAction(undefined)).toBe(false);
    expect(isValidTimerAction(123)).toBe(false);
    expect(isValidTimerAction({})).toBe(false);
  });
});
