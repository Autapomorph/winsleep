import { act, renderHook } from '@testing-library/react';

import { useScrollSpy } from './useScrollSpy';

let observerCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null;
const mockIntersectionObserver = vi.fn().mockImplementation(function IntersectionObserverMock(cb) {
  observerCallback = cb;
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  };
});

describe('useScrollSpy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
    observerCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initializes IntersectionObserver on mount', () => {
    const ids = ['section-1', 'section-2'];
    const elements = ids.map(id => {
      const el = document.createElement('div');
      el.setAttribute('id', id);
      document.body.appendChild(el);
      return el;
    });

    try {
      const { unmount } = renderHook(() => useScrollSpy(ids));

      expect(mockIntersectionObserver).toHaveBeenCalled();

      unmount();
    } finally {
      elements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }
  });

  test('updates activeId on IntersectionObserver callback', () => {
    const ids = ['section-1', 'section-2'];
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-2',
            getBoundingClientRect: () => ({ top: 200 }),
          } as unknown as Element,
        },
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 100 }),
          } as unknown as Element,
        },
      ]);
    });
    expect(result.current[0]).toBe('section-1');
  });

  test('allows setting active element manually and unlocks on scrollend event', () => {
    const ids = ['section-1', 'section-2'];
    const { result } = renderHook(() => useScrollSpy(ids));

    // Manually set active element
    act(() => {
      result.current[1]('section-2');
    });
    expect(result.current[0]).toBe('section-2');

    // Automatic intersection events should be ignored while manualSelectionRef is locked
    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 50 }),
          } as unknown as Element,
        },
      ]);
    });
    // Still section-2 because of manual lock
    expect(result.current[0]).toBe('section-2');

    // Trigger scrollend on window to release the lock
    act(() => {
      window.dispatchEvent(new Event('scrollend'));
    });

    // Intersection observer should work now
    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 50 }),
          } as unknown as Element,
        },
      ]);
    });
    expect(result.current[0]).toBe('section-1');
  });

  test('unlocks manual lock after 2000ms safety timeout fallback', () => {
    const ids = ['section-1', 'section-2'];
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => {
      result.current[1]('section-2');
    });
    expect(result.current[0]).toBe('section-2');

    // Advance timer by 2000ms to trigger the safety fallback
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // The lock is now released, check that intersection observer callback changes the active item
    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 50 }),
          } as unknown as Element,
        },
      ]);
    });
    expect(result.current[0]).toBe('section-1');
  });

  test('cancels manual lock immediately on wheel event', () => {
    const ids = ['section-1', 'section-2'];
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => {
      result.current[1]('section-2');
    });
    expect(result.current[0]).toBe('section-2');

    // Trigger a wheel event to cancel manual lock
    act(() => {
      window.dispatchEvent(new Event('wheel'));
    });

    // Lock is cancelled, intersection observer should change active element
    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 50 }),
          } as unknown as Element,
        },
      ]);
    });
    expect(result.current[0]).toBe('section-1');
  });

  test('cancels manual lock immediately on touchstart event', () => {
    const ids = ['section-1', 'section-2'];
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => {
      result.current[1]('section-2');
    });
    expect(result.current[0]).toBe('section-2');

    // Trigger touchstart event
    act(() => {
      window.dispatchEvent(new Event('touchstart'));
    });

    act(() => {
      observerCallback!([
        {
          isIntersecting: true,
          target: {
            id: 'section-1',
            getBoundingClientRect: () => ({ top: 50 }),
          } as unknown as Element,
        },
      ]);
    });
    expect(result.current[0]).toBe('section-1');
  });
});
