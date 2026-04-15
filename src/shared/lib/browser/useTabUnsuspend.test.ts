import { act, renderHook } from '@testing-library/react';

import { useTabUnsuspend } from './useTabUnsuspend';

describe('useTabUnsuspend', () => {
  let originalHiddenDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-1234-1234-1234567890ab');

    originalHiddenDescriptor =
      Object.getOwnPropertyDescriptor(Document.prototype, 'hidden') ??
      Object.getOwnPropertyDescriptor(document, 'hidden');
  });

  afterEach(() => {
    if (originalHiddenDescriptor) {
      Object.defineProperty(document, 'hidden', originalHiddenDescriptor);
    } else {
      // @ts-expect-error - cleanup property if it wasn't defined originally
      delete document.hidden;
    }
  });

  test('sets up visibilitychange event listener and requests lock', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useTabUnsuspend());

    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  test('requests lock on visibility change when tab is visible and awaits promise', async () => {
    let visibilityCallback: (() => void) | null = null;
    vi.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'visibilitychange') {
        visibilityCallback = callback as () => void;
      }
    });

    const requestSpy = vi.spyOn(navigator.locks, 'request');

    // Mock locks.request to execute the callback it receives
    let capturedCallback: (() => Promise<void>) | undefined;
    requestSpy.mockImplementation((_name, cb) => {
      capturedCallback = cb as () => Promise<void>;
      return Promise.resolve();
    });

    renderHook(() => useTabUnsuspend());

    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });

    expect(visibilityCallback).toBeTypeOf('function');

    act(() => {
      if (visibilityCallback) {
        visibilityCallback();
      }
    });

    expect(requestSpy).toHaveBeenCalledWith(
      'prevent-suspense-weblock-12345678-1234-1234-1234-1234567890ab',
      expect.any(Function),
    );

    // Call the captured lock callback to cover the await deferred.current.promise statement
    expect(capturedCallback).toBeDefined();
    expect(visibilityCallback).toBeTypeOf('function');

    const lockPromise = capturedCallback!();
    // Resolve it immediately by triggering visibility change again or resolving the hook.
    // In the implementation, visibilitychange event listener resets deferred and resolves the old one.
    act(() => {
      if (visibilityCallback) {
        visibilityCallback();
      }
    });
    await lockPromise;
  });

  test('does not throw if lock request fails', async () => {
    let visibilityCallback: (() => void) | null = null;
    vi.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'visibilitychange') {
        visibilityCallback = callback as () => void;
      }
    });

    const requestSpy = vi
      .spyOn(navigator.locks, 'request')
      .mockRejectedValue(new Error('Lock error'));

    renderHook(() => useTabUnsuspend());

    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });

    const triggerVisibility = async () => {
      expect(visibilityCallback).toBeTypeOf('function');
      if (visibilityCallback) {
        visibilityCallback();
      }
    };

    await expect(act(triggerVisibility)).resolves.not.toThrow();
    expect(requestSpy).toHaveBeenCalled();
  });
});
