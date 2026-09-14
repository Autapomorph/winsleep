import { act, renderHook } from '@testing-library/react';

import { useIntersectionObserver } from './useIntersectionObserver';

describe('useIntersectionObserver', () => {
  const observeMock = vi.fn();
  const disconnectMock = vi.fn();
  let callbackInstance: IntersectionObserverCallback;

  beforeEach(() => {
    observeMock.mockClear();
    disconnectMock.mockClear();

    class MockIntersectionObserver {
      readonly root: Element | Document | null = null;

      readonly rootMargin: string = '';

      readonly scrollMargin: string = '';

      readonly thresholds: readonly number[] = [];

      observe = (target: Element): void => {
        observeMock(target);
      };

      disconnect = (): void => {
        disconnectMock();
      };

      unobserve(): void {}

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }

      constructor(callback: IntersectionObserverCallback) {
        callbackInstance = callback;
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  test('observes target element and updates isIntersecting when intersecting', () => {
    const target = document.createElement('div');
    const targetRef = { current: target };

    const { result } = renderHook(() =>
      useIntersectionObserver(targetRef, { rootMargin: '300px 0px', threshold: 0 }),
    );

    expect(result.current).toBe(false);
    expect(observeMock).toHaveBeenCalledWith(target);

    // Simulate element entering viewport
    act(() => {
      callbackInstance(
        [
          {
            isIntersecting: true,
            target,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result.current).toBe(true);

    // Simulate element leaving viewport
    act(() => {
      callbackInstance(
        [
          {
            isIntersecting: false,
            target,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result.current).toBe(false);
  });

  test('does not observe when enabled is false', () => {
    const target = document.createElement('div');
    const targetRef = { current: target };

    const { result } = renderHook(() => useIntersectionObserver(targetRef, { enabled: false }));

    expect(result.current).toBe(false);
    expect(observeMock).not.toHaveBeenCalled();
  });

  test('disconnects observer on unmount', () => {
    const target = document.createElement('div');
    const targetRef = { current: target };

    const { unmount } = renderHook(() => useIntersectionObserver(targetRef));

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  test('returns true as fallback if IntersectionObserver is undefined', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const target = document.createElement('div');
    const targetRef = { current: target };

    const { result } = renderHook(() => useIntersectionObserver(targetRef));

    expect(result.current).toBe(true);
  });
});
