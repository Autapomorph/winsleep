import { useEffect, useRef } from 'react';

import { useSettingsStore } from '@/entities/setting';
import { useUpdateStore } from '@/entities/updater';
import { typedInvoke, typedListen } from '@/shared/api';
import { config } from '@/shared/config';
import { logger } from '@/shared/lib';

export const useAutoInstallOnExit = () => {
  const isExitingRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const unlistenAppExitRequested = typedListen('app-exit-requested', async () => {
      if (!isActive || isExitingRef.current) {
        return;
      }

      isExitingRef.current = true;
      logger.info('Application exit requested');

      const { isAutoUpdateEnabled } = useSettingsStore.getState();
      const { status, installUpdate, isManualCheck } = useUpdateStore.getState();
      const shouldInstall =
        !config.isPortable && (isAutoUpdateEnabled || isManualCheck) && status === 'readyToRestart';

      if (shouldInstall) {
        logger.info('Auto-installing downloaded update on application exit...');

        try {
          await installUpdate();
        } catch (error) {
          logger.error(`Failed to install update on exit: ${error}`);
        }
      }

      try {
        await typedInvoke('quit_app');
      } catch (error) {
        logger.error(`Failed to execute quit_app command: ${error}`);
      }
    });

    return () => {
      isActive = false;
      unlistenAppExitRequested
        .then(unlisten => {
          unlisten();
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from app-exit-requested: ${err}`);
        });
    };
  }, []);
};
