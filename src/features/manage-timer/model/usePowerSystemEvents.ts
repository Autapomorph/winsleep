import { useEffect } from 'react';

import { useTimerStore } from '@/entities/timer';
import { typedInvoke, typedListen } from '@/shared/api';
import { getDateNow, logger } from '@/shared/lib';

export const usePowerSystemEvents = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenSystemResume = typedListen('system-resume', () => {
      if (!isActive) {
        return;
      }

      const { timerState, endTime, cancel } = useTimerStore.getState();

      if (timerState === 'running' && endTime !== null) {
        const hasTimePassedDuringSleep = endTime <= getDateNow();

        if (hasTimePassedDuringSleep) {
          logger.info(
            'System wakeup detected and timer expired during sleep. Cancelling active timer.',
          );

          cancel();
        } else {
          logger.info(
            'System wakeup detected but timer has not expired yet. Resyncing backend timer.',
          );

          const remainingMs = Math.max(0, endTime - getDateNow());

          typedInvoke('start_timer', {
            durationMs: remainingMs,
            targetTimestampMs:
              useTimerStore.getState().timerMode === 'timestamp'
                ? useTimerStore.getState().targetDateTime
                : null,
          }).catch((err: unknown) => {
            logger.error(`Failed to resync backend timer after wakeup: ${err}`);
          });
        }
      }
    });

    return () => {
      isActive = false;

      unlistenSystemResume
        .then(unlisten => {
          unlisten();
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from system-resume event: ${err}`);
        });
    };
  }, []);
};
