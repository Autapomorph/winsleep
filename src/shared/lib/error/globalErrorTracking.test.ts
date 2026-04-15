import { getErrorMessage, initGlobalErrorTracking } from './globalErrorTracking';
import { logger } from '../logger/logger';

describe('globalErrorTracking', () => {
  describe('getErrorMessage', () => {
    test('handles falsy values', () => {
      expect(getErrorMessage(null)).toBe('');
      expect(getErrorMessage(undefined)).toBe('');
    });

    test('handles Error instance', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    test('handles object with message property', () => {
      expect(getErrorMessage({ message: 'some error' })).toBe('some error');
    });

    test('handles stringifiable objects', () => {
      expect(getErrorMessage({ a: 1 })).toBe('{"a":1}');
    });

    test('handles primitive values', () => {
      expect(getErrorMessage('error string')).toBe('error string');
      expect(getErrorMessage(123)).toBe('123');
    });

    test('handles circular reference objects falling back to String()', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      expect(getErrorMessage(circular)).toBe('[object Object]');
    });
  });

  describe('initGlobalErrorTracking', () => {
    test('registers error and rejection event listeners', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const onError = vi.fn();

      const deinit = initGlobalErrorTracking(onError);

      expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      deinit();

      expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    test('handles error events and filters duplicates', () => {
      const onError = vi.fn();
      const deinit = initGlobalErrorTracking(onError);

      const errorEvent = new ErrorEvent('error', {
        message: 'Some runtime crash',
        error: new Error('Crash details'),
      });

      window.dispatchEvent(errorEvent);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Unhandled runtime error: Some runtime crash. Details: Error: Crash details',
        ),
      );
      expect(onError).toHaveBeenCalled();

      // Trigger again, should throttle (prevention)
      onError.mockClear();
      window.dispatchEvent(errorEvent);
      expect(onError).not.toHaveBeenCalled();

      deinit();
    });

    test('ignores specific resize observer errors', () => {
      const onError = vi.fn();
      const deinit = initGlobalErrorTracking(onError);

      const errorEvent = new ErrorEvent('error', {
        message: 'ResizeObserver loop completed with undelivered notifications.',
        cancelable: true,
      });

      window.dispatchEvent(errorEvent);

      expect(logger.error).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();

      deinit();
    });

    test('handles unhandled rejection events', () => {
      const onError = vi.fn();
      const deinit = initGlobalErrorTracking(onError);

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: new Error('Rejection reason'),
        promise: Promise.resolve(),
      });

      window.dispatchEvent(rejectionEvent);

      expect(logger.error).toHaveBeenCalledWith('Unhandled promise rejection: Rejection reason');
      expect(onError).toHaveBeenCalled();

      deinit();
    });
  });
});
