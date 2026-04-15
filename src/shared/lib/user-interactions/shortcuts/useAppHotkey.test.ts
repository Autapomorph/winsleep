import { renderHook } from '@testing-library/react';
import { useHotkeys } from 'react-hotkeys-hook';

import { useAppHotkey } from './useAppHotkey';

vi.mock(import('react-hotkeys-hook'), () => ({
  useHotkeys: vi.fn(),
}));

describe('useAppHotkey', () => {
  test('calls useHotkeys with string keys and callback', () => {
    const callback = vi.fn();
    renderHook(() => useAppHotkey('ctrl+a', callback));

    expect(useHotkeys).toHaveBeenCalledWith(
      'ctrl+a',
      callback,
      {
        preventDefault: true,
        scopes: undefined,
      },
      undefined,
    );
  });

  test('calls useHotkeys with config object', () => {
    const callback = vi.fn();
    const config = { keys: 'ctrl+b', scopes: ['global'] };
    renderHook(() => useAppHotkey(config, callback));

    expect(useHotkeys).toHaveBeenCalledWith(
      'ctrl+b',
      callback,
      {
        preventDefault: true,
        scopes: ['global'],
      },
      undefined,
    );
  });
});
