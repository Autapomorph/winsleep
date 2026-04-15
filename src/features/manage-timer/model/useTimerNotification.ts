import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import {
  logger,
  playCustomNotificationSound,
  playSystemNotificationSound,
  sendSystemNotification,
  showErrorToast,
  showWarningToast,
} from '@/shared/lib';

export const useTimerNotification = () => {
  const { t } = useTranslation();

  const armedTimesRef = useRef<Set<number>>(new Set());
  const notifiedTimesRef = useRef<Set<number>>(new Set());

  const action = useSessionStore(state => state.timerAction);

  const timerState = useTimerStore(state => state.timerState);
  const remainingSeconds = useTimerStore(state => state.remainingSeconds);

  const isNotificationsEnabled = useSettingsStore(state => state.isNotificationsEnabled);
  const notificationTimes = useSettingsStore(state => state.notificationTimes);
  const isNotificationSoundEnabled = useSettingsStore(state => state.isNotificationSoundEnabled);
  const notificationSoundType = useSettingsStore(state => state.notificationSoundType);

  useEffect(() => {
    if (!isNotificationsEnabled) {
      armedTimesRef.current.clear();
      notifiedTimesRef.current.clear();
      return;
    }

    if (timerState === 'idle') {
      armedTimesRef.current.clear();
      notifiedTimesRef.current.clear();
      return;
    }

    if (timerState !== 'running') {
      return;
    }

    const timesToNotify: number[] = [];

    notificationTimes.forEach(({ seconds }) => {
      if (remainingSeconds > seconds) {
        armedTimesRef.current.add(seconds);
        notifiedTimesRef.current.delete(seconds);
      }

      if (
        remainingSeconds <= seconds &&
        remainingSeconds > 0 &&
        armedTimesRef.current.has(seconds) &&
        !notifiedTimesRef.current.has(seconds)
      ) {
        notifiedTimesRef.current.add(seconds);
        timesToNotify.push(seconds);
      }
    });

    if (timesToNotify.length > 0) {
      const notify = async () => {
        try {
          const actionLabels = {
            sleep: t($ => $.timerAction.notifications.planned.sleep),
            hibernate: t($ => $.timerAction.notifications.planned.hibernate),
            shutdown: t($ => $.timerAction.notifications.planned.shutdown),
            reboot: t($ => $.timerAction.notifications.planned.reboot),
            lock: t($ => $.timerAction.notifications.planned.lock),
            signout: t($ => $.timerAction.notifications.planned.signout),
          };

          showWarningToast(
            t($ => $.timer.notifications.expireSoon.title),
            actionLabels[action],
          );

          const isSent = await sendSystemNotification({
            title: actionLabels[action],
            body: t($ => $.timer.notifications.expireSoon.title),
          });

          if (isSent && isNotificationSoundEnabled) {
            if (notificationSoundType === 'app') {
              playCustomNotificationSound();
            } else {
              playSystemNotificationSound();
            }
          }
        } catch (err) {
          logger.error(`Failed to send timer notification: ${err}`);
          showErrorToast($ => $.timer.errors.systemNotificationSendFailed);
        }
      };

      notify();
    }
  }, [
    t,
    action,
    timerState,
    remainingSeconds,
    isNotificationsEnabled,
    notificationTimes,
    isNotificationSoundEnabled,
    notificationSoundType,
  ]);
};
