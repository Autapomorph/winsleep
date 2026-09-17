import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_TIMER_SECONDS, useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayActionSelection = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTrayTimerActionSelected = typedListen('tray-timer-action-selected', event => {
      if (isActive) {
        const selectedAction = event.payload;
        logger.info(`Timer action selected from tray menu: ${selectedAction}`);

        const currentAction = useSessionStore.getState().timerAction;
        if (selectedAction === currentAction) {
          return;
        }

        const { timerState, timerMode, remainingSeconds } = useTimerStore.getState();
        const { defaultTimerSeconds } = useSettingsStore.getState();
        const defaultSeconds = defaultTimerSeconds ?? DEFAULT_TIMER_SECONDS;

        if (currentAction === 'keep-awake' && timerMode === 'indefinite') {
          useTimerStore.getState().resetToDefaultDuration(defaultSeconds);
          useSessionStore.getState().setTimerAction(selectedAction);
          return;
        }

        if (currentAction !== 'keep-awake' && remainingSeconds === 0 && timerState === 'idle') {
          if (selectedAction === 'keep-awake') {
            useTimerStore.getState().setIndefinite();
            useSessionStore.getState().setTimerAction(selectedAction);
            return;
          }
        }

        useSessionStore.getState().setTimerAction(selectedAction);
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
