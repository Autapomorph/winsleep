import { useEffect } from 'react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
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

      const { isLocked, timerAction } = useSessionStore.getState();
      const { isIndefiniteActive, startIndefinite } = useKeepAwakeStore.getState();

      if (isIndefiniteActive) {
        return;
      }

      const store = useTimerStore.getState();
      const {
        timerState,
        timerMode,
        plannedSeconds,
        remainingSeconds,
        start,
        resume,
        pause,
        onCompleteCallback,
      } = store;

      if (timerState === 'running') {
        if (isLocked) {
          return;
        }

        pause();
        return;
      }

      const isKeepAwakeIndefinite =
        timerAction === 'keep-awake' &&
        timerMode === 'duration' &&
        (timerState === 'idle' ? plannedSeconds === 0 : remainingSeconds === 0);

      if (isKeepAwakeIndefinite) {
        startIndefinite();
        return;
      }

      if (!onCompleteCallback) {
        logger.warn('Cannot control timer from tray: onCompleteCallback is not set');
        return;
      }

      if (timerState === 'idle') {
        start(onCompleteCallback);
      } else if (timerState === 'paused') {
        if (isLocked) {
          return;
        }

        resume(onCompleteCallback);
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

      if (useKeepAwakeStore.getState().isIndefiniteActive) {
        useKeepAwakeStore.getState().stopIndefinite();
      }

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
