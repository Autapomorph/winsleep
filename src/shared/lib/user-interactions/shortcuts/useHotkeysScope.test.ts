import { renderHook } from '@testing-library/react';
import { useHotkeysContext } from 'react-hotkeys-hook';

import { useHotkeysScope } from './useHotkeysScope';

vi.mock(import('react-hotkeys-hook'), () => ({
  useHotkeysContext: vi.fn(() => ({
    enableScope: vi.fn(),
    disableScope: vi.fn(),
    toggleScope: vi.fn(),
    hotkeys: [],
    activeScopes: [],
  })),
}));

describe('useHotkeysScope', () => {
  test('enables scope on mount and disables on unmount when active', () => {
    const mockContext = {
      enableScope: vi.fn(),
      disableScope: vi.fn(),
      toggleScope: vi.fn(),
      hotkeys: [],
      activeScopes: [],
    };
    vi.mocked(useHotkeysContext).mockReturnValue(mockContext);

    const { unmount } = renderHook(() => useHotkeysScope('test-scope', true));

    expect(mockContext.enableScope).toHaveBeenCalledWith('test-scope');
    expect(mockContext.disableScope).not.toHaveBeenCalled();

    unmount();
    expect(mockContext.disableScope).toHaveBeenCalledWith('test-scope');
  });

  test('disables scope on mount and enables on unmount when inactive', () => {
    const mockContext = {
      enableScope: vi.fn(),
      disableScope: vi.fn(),
      toggleScope: vi.fn(),
      hotkeys: [],
      activeScopes: [],
    };
    vi.mocked(useHotkeysContext).mockReturnValue(mockContext);

    const { unmount } = renderHook(() => useHotkeysScope('test-scope', false));

    expect(mockContext.disableScope).toHaveBeenCalledWith('test-scope');
    expect(mockContext.enableScope).not.toHaveBeenCalled();

    unmount();
    expect(mockContext.enableScope).toHaveBeenCalledWith('test-scope');
  });
});
