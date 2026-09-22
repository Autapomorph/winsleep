import { act, renderHook } from '@testing-library/react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { sendSystemNotification, showWarningToast } from '@/shared/lib';
import { useTimerNotification } from './useTimerNotification';

vi.mock('@/shared/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib')>();
  return {
    ...actual,
    sendSystemNotification: vi.fn().mockResolvedValue(true),
    showWarningToast: vi.fn(),
    playNotificationSound: vi.fn(),
    playSystemNotificationSound: vi.fn(),
  };
});

describe('useTimerNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSessionStore.setState({
      timerAction: 'sleep',
    });

    useSettingsStore.setState({
      isNotificationsEnabled: true,
      notificationTimes: [
        { id: '1', seconds: 60 },
        { id: '2', seconds: 120 },
      ],
      isNotificationSoundEnabled: false,
      notificationSoundType: 'system',
    });

    useTimerStore.setState({
      timerState: 'idle',
      remainingSeconds: 0,
      endTime: null,
    });
  });

  test('does not send notification on start even if remaining time is greater than thresholds', () => {
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 900,
      endTime: Date.now() + 900000,
    });

    renderHook(() => useTimerNotification());

    expect(sendSystemNotification).not.toHaveBeenCalled();
    expect(showWarningToast).not.toHaveBeenCalled();
  });

  test('notifies naturally at 120s and 60s on countdown', () => {
    const endTime = Date.now() + 121000;
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 121,
      endTime,
    });

    const { rerender } = renderHook(() => useTimerNotification());
    expect(sendSystemNotification).not.toHaveBeenCalled();

    // Natural tick down to 120s (endTime does not change)
    act(() => {
      useTimerStore.setState({ remainingSeconds: 120 });
    });
    rerender();

    expect(sendSystemNotification).toHaveBeenCalledTimes(1);

    // Natural tick down to 61s
    act(() => {
      useTimerStore.setState({ remainingSeconds: 61 });
    });
    rerender();
    expect(sendSystemNotification).toHaveBeenCalledTimes(1);

    // Natural tick down to 60s
    act(() => {
      useTimerStore.setState({ remainingSeconds: 60 });
    });
    rerender();

    expect(sendSystemNotification).toHaveBeenCalledTimes(2);
  });

  test('disarms 120s threshold when time jumps from 900s to 61s, notifying only at 60s', () => {
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 900,
      endTime: Date.now() + 900000,
    });

    const { rerender } = renderHook(() => useTimerNotification());
    expect(sendSystemNotification).not.toHaveBeenCalled();

    // User selects preset "1 min 1 sec" (61s) -> new endTime
    act(() => {
      useTimerStore.setState({
        remainingSeconds: 61,
        endTime: Date.now() + 61000,
      });
    });
    rerender();

    // 120s must be disarmed and NOT fire at 61s
    expect(sendSystemNotification).not.toHaveBeenCalled();
    expect(showWarningToast).not.toHaveBeenCalled();

    // 1 second later: timer ticks down to 60s (endTime unchanged)
    act(() => {
      useTimerStore.setState({ remainingSeconds: 60 });
    });
    rerender();

    // Exactly one notification fires at 60s
    expect(sendSystemNotification).toHaveBeenCalledTimes(1);
    expect(showWarningToast).toHaveBeenCalledTimes(1);
  });

  test('disarms all thresholds when time jumps below all notification points', () => {
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 900,
      endTime: Date.now() + 900000,
    });

    const { rerender } = renderHook(() => useTimerNotification());

    // User selects preset "30 sec" -> new endTime
    act(() => {
      useTimerStore.setState({
        remainingSeconds: 30,
        endTime: Date.now() + 30000,
      });
    });
    rerender();

    expect(sendSystemNotification).not.toHaveBeenCalled();
  });

  test('re-arms future thresholds when timer duration is increased', () => {
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 61,
      endTime: Date.now() + 61000,
    });

    const { rerender } = renderHook(() => useTimerNotification());

    // Countdown to 60s -> notifies
    act(() => {
      useTimerStore.setState({ remainingSeconds: 60 });
    });
    rerender();
    expect(sendSystemNotification).toHaveBeenCalledTimes(1);

    // User adds time: jump to 150s -> new endTime
    act(() => {
      useTimerStore.setState({
        remainingSeconds: 150,
        endTime: Date.now() + 150000,
      });
    });
    rerender();

    // Countdown to 120s -> notifies
    act(() => {
      useTimerStore.setState({ remainingSeconds: 120 });
    });
    rerender();
    expect(sendSystemNotification).toHaveBeenCalledTimes(2);

    // Countdown to 60s -> notifies again
    act(() => {
      useTimerStore.setState({ remainingSeconds: 60 });
    });
    rerender();
    expect(sendSystemNotification).toHaveBeenCalledTimes(3);
  });

  test('does nothing when notifications are disabled', () => {
    useSettingsStore.setState({ isNotificationsEnabled: false });
    useTimerStore.setState({
      timerState: 'running',
      remainingSeconds: 121,
      endTime: Date.now() + 121000,
    });

    const { rerender } = renderHook(() => useTimerNotification());

    act(() => {
      useTimerStore.setState({ remainingSeconds: 120 });
    });
    rerender();

    expect(sendSystemNotification).not.toHaveBeenCalled();
  });
});
