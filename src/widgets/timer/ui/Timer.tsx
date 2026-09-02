import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SelectorParam } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  TimerControls,
  TimerDisplay,
  TimerPresets,
  TimerTriggerLabel,
  useTimer,
  useTimerHotkeys,
} from '@/features/manage-timer';
import {
  pcHibernate,
  pcLock,
  pcReboot,
  pcShutdown,
  pcSignout,
  pcSleep,
  TimerActionSwitch,
  useTimerActionHotkeys,
} from '@/features/select-timer-action';
import { useAppStateStore } from '@/entities/app-state';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { MAX_SECONDS, MIN_SECONDS } from '@/entities/timer';
import { type TimerAction, config, SECONDS_IN_DAY, SHORTCUT_SCOPES } from '@/shared/config';
import {
  formatDays,
  formatTime,
  getDateNow,
  logger,
  sendSystemNotification,
  showErrorToast,
  showInfoToast,
  useHotkeysScope,
  useNow,
} from '@/shared/lib';

export const Timer = () => {
  const { t } = useTranslation();

  const { action, isInitialized, setAction, setIsInitialized, setIsLocked } = useSessionStore(
    useShallow(state => ({
      action: state.timerAction,
      isInitialized: state.isInitialized,
      setAction: state.setTimerAction,
      setIsInitialized: state.setIsInitialized,
      setIsLocked: state.setIsLocked,
    })),
  );

  const {
    defaultTimerAction,
    shouldRememberSelectedTimerAction,
    defaultTimerSeconds,
    shouldRememberConfiguredTime,
    isLockedByDefault,
    setDefaultTimerAction,
    setDefaultTimerSeconds,
  } = useSettingsStore(
    useShallow(state => ({
      defaultTimerAction: state.defaultTimerAction,
      shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
      defaultTimerSeconds: state.defaultTimerSeconds,
      shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
      isLockedByDefault: state.isLockedByDefault,
      setDefaultTimerAction: state.setDefaultTimerAction,
      setDefaultTimerSeconds: state.setDefaultTimerSeconds,
    })),
  );

  const execute = useCallback(async () => {
    const currentTimerAction = useSessionStore.getState().timerAction;
    logger.info(`Executing action: ${currentTimerAction}`);

    try {
      if (currentTimerAction === 'sleep') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.sleep);
          return;
        }

        await pcSleep();
        return;
      }

      if (currentTimerAction === 'hibernate') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.hibernate);
          return;
        }

        await pcHibernate();
        return;
      }

      if (currentTimerAction === 'shutdown') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.shutdown);
          return;
        }

        await pcShutdown();
        return;
      }

      if (currentTimerAction === 'reboot') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.reboot);
          return;
        }

        await pcReboot();
        return;
      }

      if (currentTimerAction === 'lock') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.lock);
          return;
        }

        await pcLock();
        return;
      }

      if (currentTimerAction === 'signout') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.signout);
          return;
        }

        await pcSignout();
      }
    } catch (error) {
      logger.error(`Action failed: ${currentTimerAction}. Error: ${error}`);

      const actionErrorKeys: Record<TimerAction, SelectorParam> = {
        sleep: $ => $.timerAction.notifications.failed.sleep,
        hibernate: $ => $.timerAction.notifications.failed.hibernate,
        shutdown: $ => $.timerAction.notifications.failed.shutdown,
        reboot: $ => $.timerAction.notifications.failed.reboot,
        lock: $ => $.timerAction.notifications.failed.lock,
        signout: $ => $.timerAction.notifications.failed.signout,
      };
      const errorKey = actionErrorKeys[currentTimerAction];

      showErrorToast(errorKey);

      await sendSystemNotification({
        title: t(errorKey),
      });
    }
  }, [t]);

  const {
    timerState,
    timerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    isLocked,
    start,
    pause,
    resume,
    cancel,
    setExactTime,
    increaseTime,
    decreaseTime,
  } = useTimer({ onComplete: execute });

  const nowMs = useNow();

  const currentSeconds = timerState === 'idle' ? plannedSeconds : remainingSeconds;

  let formattedTime = '';
  if (timerMode === 'timestamp' && targetDateTime) {
    const targetDate = new Date(targetDateTime);
    const currentDate = new Date(nowMs);
    const tomorrowDate = new Date(nowMs);
    tomorrowDate.setDate(currentDate.getDate() + 1);

    const isToday = targetDate.toDateString() === currentDate.toDateString();
    const isTomorrow = targetDate.toDateString() === tomorrowDate.toDateString();

    if (timerState !== 'idle' && currentSeconds < SECONDS_IN_DAY) {
      formattedTime = formatTime(currentSeconds);
    } else if (isToday) {
      formattedTime = t($ => $.timer.timerDisplay.today);
    } else if (isTomorrow) {
      formattedTime = t($ => $.timer.timerDisplay.tomorrow);
    } else {
      formattedTime = formatDays(currentSeconds, t) ?? formatTime(currentSeconds);
    }
  } else {
    formattedTime = formatDays(currentSeconds, t) ?? formatTime(currentSeconds);
  }

  const executeImmediately = useCallback(() => {
    if (timerState !== 'running') {
      return;
    }

    logger.info('Executing timer action immediately (manual override)');
    cancel();
    execute();
  }, [timerState, cancel, execute]);

  useHotkeysScope(SHORTCUT_SCOPES.TIMER);

  useTimerHotkeys({
    isLocked,
    timerState,
    timerMode,
    start,
    pause,
    resume,
    cancel,
    increaseTime,
    decreaseTime,
    executeImmediately,
    setIsLocked,
  });

  useTimerActionHotkeys({
    isLocked,
    onActionChange: setAction,
  });

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const { isRestoreScheduledTimerOnStartupEnabled } = useSettingsStore.getState();
    const { scheduledTimer } = useAppStateStore.getState();
    const hasRestorableScheduledTimer =
      isRestoreScheduledTimerOnStartupEnabled &&
      scheduledTimer !== null &&
      scheduledTimer.targetDateTime > getDateNow();

    if (!hasRestorableScheduledTimer) {
      if (defaultTimerAction) {
        setAction(defaultTimerAction);
      }

      if (defaultTimerSeconds) {
        setExactTime(defaultTimerSeconds);
      }
    }

    setIsLocked(isLockedByDefault);
    setIsInitialized(true);
  }, [
    isInitialized,
    defaultTimerAction,
    defaultTimerSeconds,
    isLockedByDefault,
    setAction,
    setExactTime,
    setIsLocked,
    setIsInitialized,
  ]);

  useEffect(() => {
    if (shouldRememberConfiguredTime && timerMode === 'duration' && plannedSeconds) {
      setDefaultTimerSeconds(plannedSeconds);
    }
  }, [shouldRememberConfiguredTime, timerMode, plannedSeconds, setDefaultTimerSeconds]);

  useEffect(() => {
    if (shouldRememberSelectedTimerAction && action) {
      setDefaultTimerAction(action);
    }
  }, [shouldRememberSelectedTimerAction, action, setDefaultTimerAction]);

  return (
    <div className="grid grid-cols-1 justify-items-center gap-4 py-4">
      <TimerDisplay
        currentSeconds={currentSeconds}
        formattedTime={formattedTime}
        setExactTime={setExactTime}
        increaseTime={increaseTime}
        decreaseTime={decreaseTime}
        isDecreaseAllowed={currentSeconds > MIN_SECONDS}
        isIncreaseAllowed={currentSeconds < MAX_SECONDS}
        isLocked={isLocked}
      />

      <TimerTriggerLabel currentSeconds={currentSeconds} />

      <TimerActionSwitch action={action} isLocked={isLocked} onActionChange={setAction} />

      <TimerPresets isLocked={isLocked} setExactTime={setExactTime} />

      <TimerControls
        timerState={timerState}
        timerMode={timerMode}
        isLocked={isLocked}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onCancel={cancel}
      />
    </div>
  );
};
