import { typedInvoke } from '@/shared/api';
import { pcHibernate, pcLock, pcReboot, pcShutdown, pcSignout, pcSleep } from './actions';

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
}));

describe('timer action API', () => {
  test('calls pc_sleep', async () => {
    await pcSleep();
    expect(typedInvoke).toHaveBeenCalledWith('pc_sleep');
  });

  test('calls pc_hibernate', async () => {
    await pcHibernate();
    expect(typedInvoke).toHaveBeenCalledWith('pc_hibernate');
  });

  test('calls pc_shutdown', async () => {
    await pcShutdown();
    expect(typedInvoke).toHaveBeenCalledWith('pc_shutdown');
  });

  test('calls pc_reboot', async () => {
    await pcReboot();
    expect(typedInvoke).toHaveBeenCalledWith('pc_reboot');
  });

  test('calls pc_lock', async () => {
    await pcLock();
    expect(typedInvoke).toHaveBeenCalledWith('pc_lock');
  });

  test('calls pc_signout', async () => {
    await pcSignout();
    expect(typedInvoke).toHaveBeenCalledWith('pc_signout');
  });
});
