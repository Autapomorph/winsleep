import { renderHook } from '@testing-library/react';

import { SHORTCUTS } from '@/shared/config';
import type { useAppHotkey } from '@/shared/lib';
import { useTimerHotkeys } from './useTimerHotkeys';

const mockUseAppHotkey = vi.fn<typeof useAppHotkey>();

vi.mock(import('@/shared/lib'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useAppHotkey: (...args: Parameters<typeof mockUseAppHotkey>) => {
      mockUseAppHotkey(...args);
    },
  };
});

describe('useTimerHotkeys', () => {
  const defaultParams = {
    timerState: 'idle' as const,
    timerMode: 'duration' as const,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
    increaseTime: vi.fn(),
    decreaseTime: vi.fn(),
    executeImmediately: vi.fn(),
    setIsLocked: vi.fn(),
  };

  test('calls start on space hotkey when timerState is idle', () => {
    renderHook(() => useTimerHotkeys(defaultParams));

    const spaceCall = mockUseAppHotkey.mock.calls.find(
      c => c[0] === SHORTCUTS.TIMER.START_PAUSE_RESUME,
    );
    expect(spaceCall).toBeDefined();

    const handler = spaceCall![1] as () => void;
    handler();

    expect(defaultParams.start).toHaveBeenCalledTimes(1);
    expect(defaultParams.pause).not.toHaveBeenCalled();
  });

  test('calls pause on space hotkey when running and timerMode is duration', () => {
    renderHook(() =>
      useTimerHotkeys({
        ...defaultParams,
        timerState: 'running',
        timerMode: 'duration',
      }),
    );

    const spaceCall = mockUseAppHotkey.mock.calls.find(
      c => c[0] === SHORTCUTS.TIMER.START_PAUSE_RESUME,
    );
    const handler = spaceCall![1] as () => void;
    handler();

    expect(defaultParams.pause).toHaveBeenCalledTimes(1);
  });

  test('does not call pause on space hotkey when running and timerMode is timestamp', () => {
    renderHook(() =>
      useTimerHotkeys({
        ...defaultParams,
        timerState: 'running',
        timerMode: 'timestamp',
      }),
    );

    const spaceCall = mockUseAppHotkey.mock.calls.find(
      c => c[0] === SHORTCUTS.TIMER.START_PAUSE_RESUME,
    );
    const handler = spaceCall![1] as () => void;
    handler();

    expect(defaultParams.pause).not.toHaveBeenCalled();
    expect(defaultParams.start).not.toHaveBeenCalled();
    expect(defaultParams.resume).not.toHaveBeenCalled();
  });

  test('does nothing on space hotkey when isLocked is true', () => {
    renderHook(() =>
      useTimerHotkeys({
        ...defaultParams,
        isLocked: true,
        timerState: 'idle',
      }),
    );

    const spaceCall = mockUseAppHotkey.mock.calls.find(
      c => c[0] === SHORTCUTS.TIMER.START_PAUSE_RESUME,
    );
    const handler = spaceCall![1] as () => void;
    handler();

    expect(defaultParams.start).not.toHaveBeenCalled();
  });
});
