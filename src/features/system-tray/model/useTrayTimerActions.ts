import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayTimerActions = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTimerStart = typedListen('tray-timer-start-resume-pause-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer start/pause/resume clicked from tray menu');

      const { isLocked } = useSessionStore.getState();
      const store = useTimerStore.getState();
      const { timerState, timerMode, start, resume, pause } = store;

      if (timerState === 'running') {
        if (isLocked) {
          return;
        }

        if (timerMode === 'duration') {
          pause();
        }
        return;
      }

      if (timerState === 'idle') {
        start();
      } else if (timerState === 'paused') {
        if (isLocked) {
          return;
        }

        resume();
      }
    });

    const unlistenTimerCancel = typedListen('tray-timer-cancel-clicked', () => {
      const { isLocked } = useSessionStore.getState();

      if (isLocked) {
        return;
      }

      if (!isActive) {
        return;
      }

      logger.info('Timer cancel clicked from tray menu');

      const { cancel } = useTimerStore.getState();
      cancel();
    });

    return () => {
      isActive = false;
      Promise.all([unlistenTimerStart, unlistenTimerCancel])
        .then(unlisteners => {
          unlisteners.forEach(unlisten => unlisten());
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray timer action events: ${err}`);
        });
    };
  }, []);
};
