import { useEffect, useRef } from 'react';

import { useAppStateStore } from '@/entities/app-state';
import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { getDateNow, logger, showInfoToast, showWarningToast } from '@/shared/lib';

export const useScheduledTimerRestore = () => {
  const isCheckedRef = useRef(false);

  useEffect(() => {
    if (isCheckedRef.current) {
      return;
    }

    isCheckedRef.current = true;

    const { isRestoreScheduledTimerOnStartupEnabled } = useSettingsStore.getState();
    if (!isRestoreScheduledTimerOnStartupEnabled) {
      return;
    }

    const { scheduledTimer } = useAppStateStore.getState();
    if (!scheduledTimer) {
      return;
    }

    if (scheduledTimer.targetDateTime === null) {
      const rawAction = (scheduledTimer as { timerAction: unknown }).timerAction;
      if (rawAction === 'keep-awake') {
        logger.info('Restoring saved indefinite keep-awake from disk');

        useSessionStore.getState().setTimerAction('keep-awake');
        useKeepAwakeStore.getState().startIndefinite();
        useTimerStore.getState().setExactTime(0);

        showInfoToast($ => $.timer.notifications.keepAwakeRestored.title);
      } else {
        logger.warn(
          `Unexpected null targetDateTime for action ${String(rawAction)}. Clearing state.`,
        );
        useAppStateStore.getState().clearScheduledTimer();
      }

      return;
    }

    const now = getDateNow();

    if (scheduledTimer.targetDateTime > now) {
      logger.info(
        `Restoring saved scheduled timer from disk for target timestamp: ${scheduledTimer.targetDateTime}`,
      );

      useSessionStore.getState().setTimerAction(scheduledTimer.timerAction);
      useTimerStore.getState().restoreScheduledTimer(scheduledTimer.targetDateTime);

      showInfoToast($ => $.timer.notifications.scheduledTimerRestored.title);
    } else {
      logger.info(
        `Saved scheduled timer expired while offline (target: ${scheduledTimer.targetDateTime}, now: ${now}). Clearing state.`,
      );

      useAppStateStore.getState().clearScheduledTimer();

      showWarningToast($ => $.timer.notifications.scheduledTimerExpiredWhileOffline.title);
    }
  }, []);
};
