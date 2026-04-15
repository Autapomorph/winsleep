import { invoke } from '@tauri-apps/api/core';

import { typedInvoke } from './typedInvoke';

vi.mock(import('@tauri-apps/api/core'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    invoke: vi.fn().mockResolvedValue(undefined),
  };
});

describe('typedInvoke', () => {
  test('calls invoke with command and args', async () => {
    await typedInvoke('pc_sleep');
    expect(invoke).toHaveBeenCalledWith('pc_sleep', undefined);
  });
});
