import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStateStore } from '@/entities/app-state';
import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { getDateNow } from '@/shared/lib';

interface Props {
  setExactTime: (seconds: number) => void;
}

export const useTimerDefaults = ({ setExactTime }: Props) => {
  const { action, isInitialized, setAction, setIsInitialized, setIsLocked } = useSessionStore(
    useShallow(state => ({
      action: state.timerAction,
      isInitialized: state.isInitialized,
      setAction: state.setTimerAction,
      setIsInitialized: state.setIsInitialized,
      setIsLocked: state.setIsLocked,
    })),
  );

  const {
    defaultTimerAction,
    shouldRememberSelectedTimerAction,
    defaultTimerSeconds,
    shouldRememberConfiguredTime,
    isLockedByDefault,
    setDefaultTimerAction,
    setDefaultTimerSeconds,
  } = useSettingsStore(
    useShallow(state => ({
      defaultTimerAction: state.defaultTimerAction,
      shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
      defaultTimerSeconds: state.defaultTimerSeconds,
      shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
      isLockedByDefault: state.isLockedByDefault,
      setDefaultTimerAction: state.setDefaultTimerAction,
      setDefaultTimerSeconds: state.setDefaultTimerSeconds,
    })),
  );

  const { timerMode, plannedSeconds } = useTimerStore(
    useShallow(state => ({
      timerMode: state.timerMode,
      plannedSeconds: state.plannedSeconds,
    })),
  );

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const { isRestoreScheduledTimerOnStartupEnabled } = useSettingsStore.getState();
    const { scheduledTimer } = useAppStateStore.getState();
    const hasRestorableScheduledTimer =
      isRestoreScheduledTimerOnStartupEnabled &&
      scheduledTimer !== null &&
      (scheduledTimer.targetDateTime === null
        ? scheduledTimer.timerAction === 'keep-awake'
        : scheduledTimer.targetDateTime > getDateNow());

    if (!hasRestorableScheduledTimer) {
      if (defaultTimerAction) {
        setAction(defaultTimerAction);
      }

      if (defaultTimerSeconds) {
        setExactTime(defaultTimerSeconds);
      }
    }

    setIsLocked(isLockedByDefault);
    setIsInitialized(true);
  }, [
    isInitialized,
    defaultTimerAction,
    defaultTimerSeconds,
    isLockedByDefault,
    setAction,
    setExactTime,
    setIsLocked,
    setIsInitialized,
  ]);

  useEffect(() => {
    if (shouldRememberConfiguredTime && timerMode === 'duration' && plannedSeconds) {
      setDefaultTimerSeconds(plannedSeconds);
    }
  }, [shouldRememberConfiguredTime, timerMode, plannedSeconds, setDefaultTimerSeconds]);

  useEffect(() => {
    if (shouldRememberSelectedTimerAction && action) {
      setDefaultTimerAction(action);
    }
  }, [shouldRememberSelectedTimerAction, action, setDefaultTimerAction]);
};
