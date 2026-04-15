import { listen } from '@tauri-apps/api/event';

import { typedListen } from './typedListen';

vi.mock(import('@tauri-apps/api/event'), () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('typedListen', () => {
  test('calls listen with event name and callback', async () => {
    const callback = vi.fn();
    await typedListen('app-ready', callback);
    expect(listen).toHaveBeenCalledWith('app-ready', callback);
  });
});
