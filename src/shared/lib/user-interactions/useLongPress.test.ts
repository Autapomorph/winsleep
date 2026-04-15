import { act, renderHook } from '@testing-library/react';

import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('triggers callback immediately on press start', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));

    act(() => {
      result.current.onPressStart();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('ignores subsequent press starts if already pressed', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback));

    act(() => {
      result.current.onPressStart();
      result.current.onPressStart();
    });

    // Callback should only be called once, not twice
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('exits tick callback early if not pressed when it fires', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback, 200, 100, 50));

    // Spy on clearTimeout to disable it, so the timer still runs even after onPressEnd
    vi.spyOn(window, 'clearTimeout').mockImplementation(() => {});

    act(() => {
      result.current.onPressStart();
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onPressEnd();
    });

    // Advance timer to trigger tick callback
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // The callback should not be called again because tick exited early due to !isPressedRef.current
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('triggers callback repeatedly during long press', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLongPress(callback, 200, 100, 50));

    act(() => {
      result.current.onPressStart();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.onPressEnd();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
