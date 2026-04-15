import { renderHook } from '@testing-library/react';

import { initGlobalErrorTracking } from './globalErrorTracking';
import { useGlobalErrorTracking } from './useGlobalErrorTracking';

vi.mock(import('./globalErrorTracking'), async importOriginal => ({
  ...(await importOriginal()),
  initGlobalErrorTracking: vi.fn(() => vi.fn()),
}));

vi.mock(import('../toast/errorToast'), async importOriginal => ({
  ...(await importOriginal()),
  showErrorToast: vi.fn(),
}));

describe('useGlobalErrorTracking', () => {
  test('calls initGlobalErrorTracking on mount and returns cleanup', () => {
    const { unmount } = renderHook(() => useGlobalErrorTracking());

    expect(initGlobalErrorTracking).toHaveBeenCalled();
    const cleanupSpy = vi.mocked(initGlobalErrorTracking).mock.results[0].value;

    unmount();
    expect(cleanupSpy).toHaveBeenCalled();
  });
});
