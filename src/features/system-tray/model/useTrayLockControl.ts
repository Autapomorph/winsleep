import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayLockControl = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenSettingsLockToggle = typedListen('tray-settings-lock-toggle-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer lock toggle clicked from tray menu');

      const { toggleLock } = useSessionStore.getState();
      toggleLock();
    });

    return () => {
      isActive = false;
      unlistenSettingsLockToggle
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray lock toggle event: ${err}`);
        });
    };
  }, []);
};
