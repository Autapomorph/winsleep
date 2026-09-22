import { useEffect } from 'react';

import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { DEFAULT_TIMER_SECONDS } from '@/shared/config';
import { logger } from '@/shared/lib';

export const useTrayActionSelection = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTrayTimerActionSelected = typedListen('tray-timer-action-selected', event => {
      if (isActive) {
        const selectedAction = event.payload;
        logger.info(`Timer action selected from tray menu: ${selectedAction}`);

        const { defaultTimerSeconds } = useSettingsStore.getState();
        const defaultSeconds = defaultTimerSeconds ?? DEFAULT_TIMER_SECONDS;

        useTimerStore.getState().setTimerAction(selectedAction, defaultSeconds);
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
