import { useEffect } from 'react';

import { useAppStateStore } from '@/entities/app-state';
import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { getDateNow } from '@/shared/lib';

export const useScheduledTimerStateSync = () => {
  useEffect(() => {
    const syncScheduledTimerState = () => {
      const { timerState, timerMode, targetDateTime } = useTimerStore.getState();
      const currentScheduled = useAppStateStore.getState().scheduledTimer;

      if (timerState === 'running' && timerMode === 'timestamp' && targetDateTime !== null) {
        const { timerAction } = useSessionStore.getState();

        if (
          currentScheduled?.targetDateTime !== targetDateTime ||
          currentScheduled?.timerAction !== timerAction
        ) {
          useAppStateStore.getState().setScheduledTimer({
            targetDateTime,
            timerAction,
            armedAt: currentScheduled?.armedAt ?? getDateNow(),
          });
        }
      } else if (currentScheduled !== null) {
        useAppStateStore.getState().clearScheduledTimer();
      }
    };

    const unsubscribeTimer = useTimerStore.subscribe(syncScheduledTimerState);
    const unsubscribeSession = useSessionStore.subscribe(syncScheduledTimerState);

    return () => {
      unsubscribeTimer();
      unsubscribeSession();
    };
  }, []);
};
