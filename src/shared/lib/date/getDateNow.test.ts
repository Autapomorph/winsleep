import { getDateNow } from './getDateNow';

describe('getDateNow', () => {
  test('returns a number representing current timestamp', () => {
    const now = getDateNow();

    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });
});
