import { openUrl } from '@tauri-apps/plugin-opener';

import { openExternalLink } from './openExternalLink';

vi.mock(import('@tauri-apps/plugin-opener'), () => ({
  openUrl: vi.fn(),
}));

describe('openExternalLink', () => {
  test('calls openUrl with the provided url', async () => {
    vi.mocked(openUrl).mockResolvedValueOnce(undefined);

    await openExternalLink('https://example.com');

    expect(openUrl).toHaveBeenCalledWith('https://example.com');
  });

  test('does not throw when openUrl fails', async () => {
    vi.mocked(openUrl).mockRejectedValueOnce(new Error('Failed to start process'));

    await expect(openExternalLink('https://example.com')).resolves.not.toThrow();
  });
});
