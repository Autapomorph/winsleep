import { delay } from './delay';

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should resolve after the specified timeout', async () => {
    const promise = delay(1000);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  test('should reject if aborted before delay completes', async () => {
    const controller = new AbortController();
    const promise = delay(1000, controller.signal);

    // Abort after 500ms
    vi.advanceTimersByTime(500);
    controller.abort();

    await expect(promise).rejects.toThrow('Aborted');
  });

  test('should reject immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const promise = delay(1000, controller.signal);

    await expect(promise).rejects.toThrow('Aborted');
  });
});
