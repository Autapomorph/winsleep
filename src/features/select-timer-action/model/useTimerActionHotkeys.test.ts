import { renderHook } from '@testing-library/react';

import { SHORTCUTS } from '@/shared/config';
import type { useAppHotkey } from '@/shared/lib';
import { useTimerActionHotkeys } from './useTimerActionHotkeys';

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

describe('useTimerActionHotkeys hook', () => {
  test('registers all 6 actions with correct hotkey configurations when unlocked', () => {
    const onActionChange = vi.fn();

    renderHook(() => useTimerActionHotkeys({ onActionChange, isLocked: false }));

    const expectedActions = [
      { shortcut: SHORTCUTS.ACTION.SLEEP, actionName: 'sleep' },
      { shortcut: SHORTCUTS.ACTION.HIBERNATE, actionName: 'hibernate' },
      { shortcut: SHORTCUTS.ACTION.SHUTDOWN, actionName: 'shutdown' },
      { shortcut: SHORTCUTS.ACTION.REBOOT, actionName: 'reboot' },
      { shortcut: SHORTCUTS.ACTION.LOCK, actionName: 'lock' },
      { shortcut: SHORTCUTS.ACTION.SIGN_OUT, actionName: 'signout' },
    ];

    expectedActions.forEach(({ shortcut, actionName }) => {
      const call = mockUseAppHotkey.mock.calls.find(c => c[0] === shortcut);
      expect(call).toBeDefined();

      expect(call![2]).toEqual({ enabled: true });

      onActionChange.mockClear();
      const callback = call![1] as unknown as () => void;
      callback();
      expect(onActionChange).toHaveBeenCalledWith(actionName);
    });
  });

  test('registers all actions as disabled when locked', () => {
    const onActionChange = vi.fn();

    renderHook(() => useTimerActionHotkeys({ onActionChange, isLocked: true }));

    // All hotkeys must carry enabled:false — useAppHotkey uses this to suppress invocation
    const { calls } = mockUseAppHotkey.mock;
    calls.forEach(call => {
      expect(call[2]).toEqual({ enabled: false });
    });
  });

  test('defaults isLocked to false when not provided', () => {
    const onActionChange = vi.fn();

    renderHook(() => useTimerActionHotkeys({ onActionChange }));

    const { calls } = mockUseAppHotkey.mock;
    calls.forEach(call => {
      expect(call[2]).toEqual({ enabled: true });
    });
  });
});
