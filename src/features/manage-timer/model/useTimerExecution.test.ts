import { renderHook } from '@testing-library/react';

import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { pcHibernate, pcLock, pcReboot, pcShutdown, pcSignout, pcSleep } from '@/shared/api';
import { config } from '@/shared/config';
import * as sharedLib from '@/shared/lib';
import { useTimerExecution } from './useTimerExecution';

vi.mock('@/shared/api', async importOriginal => ({
  ...(await importOriginal()),
  pcSleep: vi.fn().mockResolvedValue(undefined),
  pcHibernate: vi.fn().mockResolvedValue(undefined),
  pcShutdown: vi.fn().mockResolvedValue(undefined),
  pcReboot: vi.fn().mockResolvedValue(undefined),
  pcLock: vi.fn().mockResolvedValue(undefined),
  pcSignout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/lib', async importOriginal => {
  return {
    ...(await importOriginal()),
    sendSystemNotification: vi.fn().mockResolvedValue(undefined),
    showErrorToast: vi.fn(),
    showInfoToast: vi.fn(),
  };
});

describe('useTimerExecution', () => {
  beforeEach(() => {
    useTimerStore.setState({ timerAction: 'sleep' });
    useSettingsStore.setState({ isForceActionEnabled: false });
  });

  test('calls pcSleep in prod mode when action is sleep', async () => {
    const originalProd = config.isProd;
    config.isProd = true;

    useTimerStore.setState({ timerAction: 'sleep' });
    const { result } = renderHook(() => useTimerExecution());

    await result.current.execute();

    expect(pcSleep).toHaveBeenCalledTimes(1);

    config.isProd = originalProd;
  });

  test('shows toast instead of executing pcShutdown when not in prod', async () => {
    const originalProd = config.isProd;
    config.isProd = false;

    useTimerStore.setState({ timerAction: 'shutdown' });
    const { result } = renderHook(() => useTimerExecution());

    await result.current.execute();

    expect(pcShutdown).not.toHaveBeenCalled();
    expect(sharedLib.showInfoToast).toHaveBeenCalled();

    config.isProd = originalProd;
  });

  test('calls pcShutdown with isForce in prod mode', async () => {
    const originalProd = config.isProd;
    config.isProd = true;

    useTimerStore.setState({ timerAction: 'shutdown' });
    useSettingsStore.setState({ isForceActionEnabled: true });
    const { result } = renderHook(() => useTimerExecution());

    await result.current.execute();

    expect(pcShutdown).toHaveBeenCalledWith({ isForce: true });

    config.isProd = originalProd;
  });

  test('calls pcHibernate, pcReboot, pcLock, pcSignout appropriately in prod', async () => {
    const originalProd = config.isProd;
    config.isProd = true;

    const { result } = renderHook(() => useTimerExecution());

    useTimerStore.setState({ timerAction: 'hibernate' });
    await result.current.execute();
    expect(pcHibernate).toHaveBeenCalledTimes(1);

    useTimerStore.setState({ timerAction: 'reboot' });
    await result.current.execute();
    expect(pcReboot).toHaveBeenCalledWith({ isForce: false });

    useTimerStore.setState({ timerAction: 'lock' });
    await result.current.execute();
    expect(pcLock).toHaveBeenCalledTimes(1);

    useTimerStore.setState({ timerAction: 'signout' });
    await result.current.execute();
    expect(pcSignout).toHaveBeenCalledWith({ isForce: false });

    config.isProd = originalProd;
  });

  test('shows info toast and sends system notification on keep-awake finished', async () => {
    useTimerStore.setState({ timerAction: 'keep-awake' });
    const { result } = renderHook(() => useTimerExecution());

    await result.current.execute();

    expect(sharedLib.showInfoToast).toHaveBeenCalled();
    expect(sharedLib.sendSystemNotification).toHaveBeenCalled();
  });

  test('handles action error with toast and notification', async () => {
    const originalProd = config.isProd;
    config.isProd = true;

    vi.mocked(pcSleep).mockRejectedValueOnce(new Error('Sleep API failure'));
    useTimerStore.setState({ timerAction: 'sleep' });
    const { result } = renderHook(() => useTimerExecution());

    await result.current.execute();

    expect(sharedLib.showErrorToast).toHaveBeenCalled();
    expect(sharedLib.sendSystemNotification).toHaveBeenCalled();

    config.isProd = originalProd;
  });
});
