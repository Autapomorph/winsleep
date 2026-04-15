import { windowClose, windowMinimize } from './window';

const mockMinimize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);

vi.mock(import('@tauri-apps/api/window'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    getCurrentWindow: () =>
      Object.assign(original.getCurrentWindow(), {
        minimize: mockMinimize,
        close: mockClose,
      }),
  };
});

describe('window API', () => {
  test('calls minimize on current window', async () => {
    await windowMinimize();
    expect(mockMinimize).toHaveBeenCalled();
  });

  test('calls close on current window', async () => {
    await windowClose();
    expect(mockClose).toHaveBeenCalled();
  });
});
