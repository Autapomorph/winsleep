import { beforeEach, describe, expect, test, vi } from 'vitest';

import { typedInvoke } from '@/shared/api';
import { config } from '@/shared/config';
import { initializePortable } from './initializePortable';

vi.mock('@/shared/api', () => ({
  typedInvoke: vi.fn(),
}));

describe('initializePortable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.isPortable = false;
  });

  test('sets config.isPortable to true when backend reports portable mode', async () => {
    vi.mocked(typedInvoke).mockResolvedValueOnce(true);

    await initializePortable();

    expect(typedInvoke).toHaveBeenCalledWith('is_portable');
    expect(config.isPortable).toBe(true);
  });

  test('keeps config.isPortable as false when backend reports non-portable mode', async () => {
    vi.mocked(typedInvoke).mockResolvedValueOnce(false);

    await initializePortable();

    expect(typedInvoke).toHaveBeenCalledWith('is_portable');
    expect(config.isPortable).toBe(false);
  });

  test('gracefully handles backend invocation error without throwing', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('IPC error'));

    await expect(initializePortable()).resolves.toBeUndefined();
    expect(config.isPortable).toBe(false);
  });
});
