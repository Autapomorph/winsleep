import { useEffect } from 'react';

import { useAppStateStore } from '@/entities/app-state';
import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { getDateNow } from '@/shared/lib';

export const useScheduledTimerStateSync = () => {
  useEffect(() => {
    const syncScheduledTimerState = () => {
      const { timerState, timerMode, targetDateTime } = useTimerStore.getState();
      const { timerAction } = useSessionStore.getState();
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

    const handleSessionChange = () => {
      const { timerState, timerMode } = useTimerStore.getState();

      if (timerState === 'running' && (timerMode === 'timestamp' || timerMode === 'indefinite')) {
        syncScheduledTimerState();
      }
    };

    const unsubscribeTimer = useTimerStore.subscribe(syncScheduledTimerState);
    const unsubscribeSession = useSessionStore.subscribe(handleSessionChange);

    return () => {
      unsubscribeTimer();
      unsubscribeSession();
    };
  }, []);
};
