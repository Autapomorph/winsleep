import { useCallback } from 'react';
import type { SelectorParam } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  pcHibernate,
  pcLock,
  pcReboot,
  pcShutdown,
  pcSignout,
  pcSleep,
} from '@/features/select-timer-action';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { type TimerAction, config } from '@/shared/config';
import { logger, sendSystemNotification, showErrorToast, showInfoToast } from '@/shared/lib';

export const useTimerExecution = () => {
  const { t } = useTranslation();

  const execute = useCallback(async () => {
    const currentTimerAction = useSessionStore.getState().timerAction;
    const isForce = useSettingsStore.getState().isForceActionEnabled;
    logger.info(`Executing action: ${currentTimerAction}, forcing: ${isForce}`);

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

        await pcShutdown({ isForce });
        return;
      }

      if (currentTimerAction === 'reboot') {
        if (!config.isProd) {
          showInfoToast($ => $.timerAction.notifications.planned.reboot);
          return;
        }

        await pcReboot({ isForce });
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

        await pcSignout({ isForce });
        return;
      }

      if (currentTimerAction === 'keep-awake') {
        showInfoToast($ => $.timerAction.notifications.finished.keepAwake);

        await sendSystemNotification({
          title: t($ => $.timerAction.notifications.finished.keepAwake),
        });
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
        'keep-awake': $ => $.timerAction.notifications.failed.keepAwake,
      };

      const errorKey = actionErrorKeys[currentTimerAction];

      showErrorToast(errorKey);

      await sendSystemNotification({
        title: t(errorKey),
      });
    }
  }, [t]);

  return { execute };
};
