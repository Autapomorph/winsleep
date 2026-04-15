import { renderHook } from '@testing-library/react';

import { typedEmit } from '@/shared/api';
import { useAppReady } from './useAppReady';

vi.mock(import('@/shared/api'), () => ({
  typedEmit: vi.fn(),
}));

describe('useAppReady', () => {
  test('emits app-ready on mount', () => {
    renderHook(() => useAppReady());

    expect(typedEmit).toHaveBeenCalledWith('app-ready');
  });
});
