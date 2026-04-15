import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@/entities/setting';
import { typedListen } from '@/shared/api';
import { logger, sendSystemNotification } from '@/shared/lib';

export const useClosedToTrayNotification = () => {
  const { t } = useTranslation();

  useEffect(() => {
    let isActive = true;

    const unlistenPromise = typedListen('window-closed-to-tray', async () => {
      if (isActive) {
        const settings = useSettingsStore.getState();

        if (!settings.hasSeenTrayNotification) {
          const isSent = await sendSystemNotification({
            title: t($ => $.tray.notifications.closedToTray.title),
            body: t($ => $.tray.notifications.closedToTray.body),
          });

          if (isSent && isActive) {
            settings.setHasSeenTrayNotification(true);
          }
        }
      }
    });

    return () => {
      isActive = false;
      unlistenPromise
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from closed-to-tray events: ${err}`);
        });
    };
  }, [t]);
};
