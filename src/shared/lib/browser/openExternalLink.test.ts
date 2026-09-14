import { openUrl } from '@tauri-apps/plugin-opener';

import { openExternalLink } from './openExternalLink';
import { logger } from '../logger/logger';

vi.mock(import('@tauri-apps/plugin-opener'), () => ({
  openUrl: vi.fn(),
}));

describe('openExternalLink', () => {
  test('calls openUrl with a valid https url', async () => {
    vi.mocked(openUrl).mockResolvedValueOnce(undefined);

    await openExternalLink('https://example.com');

    expect(openUrl).toHaveBeenCalledWith('https://example.com');
  });

  test('calls openUrl with a valid http url', async () => {
    vi.mocked(openUrl).mockResolvedValueOnce(undefined);

    await openExternalLink('http://example.com');

    expect(openUrl).toHaveBeenCalledWith('http://example.com');
  });

  test.each([
    'file:///C:/Windows/System32/calc.exe',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'ms-settings:privacy',
    'cmd:foo',
  ])('blocks unsafe protocol %s and logs warning', async unsafeUrl => {
    await openExternalLink(unsafeUrl);

    expect(openUrl).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Blocked attempt to open unsafe URL protocol'),
    );
  });

  test('handles invalid url strings gracefully and logs error', async () => {
    await openExternalLink('not-a-valid-url');

    expect(openUrl).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to open URL: not-a-valid-url'),
    );
  });

  test('does not throw when openUrl fails', async () => {
    vi.mocked(openUrl).mockRejectedValueOnce(new Error('Failed to start process'));

    await expect(openExternalLink('https://example.com')).resolves.not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to open URL: https://example.com'),
    );
  });
});
