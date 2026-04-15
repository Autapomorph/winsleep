import { noop } from './noop';

describe('noop', () => {
  test('does nothing when called', () => {
    expect(noop()).toBeUndefined();
  });
});
