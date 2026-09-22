import { useEffect } from 'react';

import { useAppStateStore } from '@/entities/app-state';
import { useTimerStore } from '@/entities/timer';
import { getDateNow } from '@/shared/lib';

export const useScheduledTimerStateSync = () => {
  useEffect(() => {
    const syncScheduledTimerState = () => {
      const { timerState, timerMode, targetDateTime, timerAction } = useTimerStore.getState();
      const { scheduledTimer } = useAppStateStore.getState();

      if (timerAction === 'keep-awake' && timerMode === 'indefinite' && timerState === 'running') {
        if (
          scheduledTimer?.targetDateTime !== null ||
          scheduledTimer?.timerAction !== 'keep-awake'
        ) {
          useAppStateStore.getState().setScheduledTimer({
            targetDateTime: null,
            timerAction: 'keep-awake',
            armedAt: scheduledTimer?.armedAt ?? getDateNow(),
          });
        }
      } else if (timerState === 'running' && timerMode === 'timestamp' && targetDateTime !== null) {
        if (
          scheduledTimer?.targetDateTime !== targetDateTime ||
          scheduledTimer?.timerAction !== timerAction
        ) {
          useAppStateStore.getState().setScheduledTimer({
            targetDateTime,
            timerAction,
            armedAt: scheduledTimer?.armedAt ?? getDateNow(),
          });
        }
      } else if (scheduledTimer !== null) {
        useAppStateStore.getState().clearScheduledTimer();
      }
    };

    const unsubscribeTimer = useTimerStore.subscribe(syncScheduledTimerState);

    return () => {
      unsubscribeTimer();
    };
  }, []);
};
