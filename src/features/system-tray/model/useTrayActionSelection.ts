import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayActionSelection = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTrayTimerActionSelected = typedListen('tray-timer-action-selected', event => {
      if (isActive) {
        const selectedAction = event.payload;
        logger.info(`Timer action selected from tray menu: ${selectedAction}`);

        const session = useSessionStore.getState();
        session.setTimerAction(selectedAction);
      }
    });

    return () => {
      isActive = false;
      unlistenTrayTimerActionSelected
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray timer action selection events: ${err}`);
        });
    };
  }, []);
};
