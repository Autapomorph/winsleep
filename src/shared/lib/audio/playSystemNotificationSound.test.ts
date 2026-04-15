import { typedInvoke } from '@/shared/api';
import { playSystemNotificationSound } from './playSystemNotificationSound';

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
}));

describe('playSystemNotificationSound', () => {
  test('calls typedInvoke with play_notification_sound', async () => {
    vi.mocked(typedInvoke).mockResolvedValueOnce(undefined);
    await playSystemNotificationSound();

    expect(typedInvoke).toHaveBeenCalledWith('play_notification_sound');
  });

  test('does not throw when backend invocation fails', async () => {
    vi.mocked(typedInvoke).mockRejectedValueOnce(new Error('Backend error'));

    await expect(playSystemNotificationSound()).resolves.not.toThrow();
  });
});
