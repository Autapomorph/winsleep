import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

import { sendSystemNotification } from './sendSystemNotification';

vi.mock(import('@tauri-apps/plugin-notification'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    isPermissionGranted: vi.fn().mockResolvedValue(true),
    requestPermission: vi.fn().mockResolvedValue('granted' as const),
    sendNotification: vi.fn(),
  };
});

describe('sendSystemNotification', () => {
  test('sends notification if permission is already granted', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValueOnce(true);

    const result = await sendSystemNotification('Test Message');

    expect(result).toBe(true);
    expect(sendNotification).toHaveBeenCalledWith({ title: 'Test Message' });
  });

  test('requests permission if not already granted and sends if user accepts', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValueOnce(false);
    vi.mocked(requestPermission).mockResolvedValueOnce('granted');

    const result = await sendSystemNotification({ title: 'Hello', body: 'World' });

    expect(result).toBe(true);
    expect(sendNotification).toHaveBeenCalledWith({ title: 'Hello', body: 'World' });
  });

  test('returns false and does not send if permission request is denied', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValueOnce(false);
    vi.mocked(requestPermission).mockResolvedValueOnce('denied');

    const result = await sendSystemNotification('Test Message');

    expect(result).toBe(false);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  test('returns false and does not throw when sending fails', async () => {
    vi.mocked(isPermissionGranted).mockRejectedValueOnce(new Error('API Error'));

    await expect(sendSystemNotification('Test Message')).resolves.toBe(false);
  });
});
