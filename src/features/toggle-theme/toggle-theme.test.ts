import { act, renderHook } from '@testing-library/react';

import { useDevThemeShortcut } from './lib/useDevThemeShortcut';

const mockSetTheme = vi.fn();
let mockTheme = 'system';

vi.mock(import('next-themes'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useTheme: () => ({
      theme: mockTheme,
      setTheme: mockSetTheme,
      forcedTheme: undefined,
      resolvedTheme: mockTheme,
      themes: ['light', 'dark', 'system'],
      systemTheme: 'dark',
    }),
  };
});

let capturedAppHotkeyCallback: (() => void) | undefined;
vi.mock(import('@/shared/lib'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useAppHotkey: (_shortcut: unknown, callback: Parameters<typeof original.useAppHotkey>[1]) => {
      capturedAppHotkeyCallback = callback as () => void;
    },
  };
});

describe('useDevThemeShortcut hook', () => {
  beforeEach(() => {
    mockTheme = 'system';
  });

  test('cycles themes dark -> light -> system on dev hotkey trigger', () => {
    const { rerender } = renderHook(() => useDevThemeShortcut());

    expect(capturedAppHotkeyCallback).toBeDefined();

    // 1. Current theme: system -> next: dark
    mockTheme = 'system';
    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    // 2. Current theme: dark -> next: light
    mockTheme = 'dark';
    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });
    expect(mockSetTheme).toHaveBeenLastCalledWith('light');

    // 3. Current theme: light -> next: system
    mockTheme = 'light';
    rerender();
    act(() => {
      capturedAppHotkeyCallback!();
    });
    expect(mockSetTheme).toHaveBeenLastCalledWith('system');
  });
});
