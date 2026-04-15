import { emit } from '@tauri-apps/api/event';

import { typedEmit } from './typedEmit';

vi.mock(import('@tauri-apps/api/event'), () => ({
  emit: vi.fn(() => Promise.resolve()),
}));

describe('typedEmit', () => {
  test('calls emit with event name and payload', async () => {
    await typedEmit('app-ready');
    expect(emit).toHaveBeenCalledWith('app-ready', undefined);
  });
});
