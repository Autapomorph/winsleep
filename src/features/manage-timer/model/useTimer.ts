import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { DEFAULT_TIMER_STEP_SECONDS } from '@/shared/config';

export const useTimer = () => {
  const {
    timerState,
    timerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    startStore,
    pauseStore,
    resumeStore,
    cancelStore,
    increaseTimeStore,
    decreaseTimeStore,
    setExactTimeStore,
    setTimerModeStore,
    setIndefiniteStore,
  } = useTimerStore(
    useShallow(state => ({
      timerState: state.timerState,
      timerMode: state.timerMode,
      plannedSeconds: state.plannedSeconds,
      remainingSeconds: state.remainingSeconds,
      targetDateTime: state.targetDateTime,
      startStore: state.start,
      pauseStore: state.pause,
      resumeStore: state.resume,
      cancelStore: state.cancel,
      increaseTimeStore: state.increaseTime,
      decreaseTimeStore: state.decreaseTime,
      setExactTimeStore: state.setExactTime,
      setTimerModeStore: state.setTimerMode,
      setIndefiniteStore: state.setIndefinite,
    })),
  );

  const { isLocked, toggleLock } = useSessionStore(
    useShallow(state => ({
      isLocked: state.isLocked,
      toggleLock: state.toggleLock,
    })),
  );

  const { isCustomTimerStepsEnabled, timerStepIncrease, timerStepDecrease } = useSettingsStore(
    useShallow(state => ({
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      timerStepIncrease: state.timerStepIncrease,
      timerStepDecrease: state.timerStepDecrease,
    })),
  );

  const increaseStep = useMemo(
    () => (isCustomTimerStepsEnabled ? timerStepIncrease : DEFAULT_TIMER_STEP_SECONDS),
    [isCustomTimerStepsEnabled, timerStepIncrease],
  );

  const decreaseStep = useMemo(
    () => (isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS),
    [isCustomTimerStepsEnabled, timerStepDecrease],
  );

  const increaseTime = useCallback(() => {
    increaseTimeStore(increaseStep);
  }, [increaseTimeStore, increaseStep]);

  const decreaseTime = useCallback(() => {
    decreaseTimeStore(decreaseStep);
  }, [decreaseTimeStore, decreaseStep]);

  return {
    timerState,
    timerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    isLocked,
    start: startStore,
    pause: pauseStore,
    resume: resumeStore,
    cancel: cancelStore,
    increaseTime,
    decreaseTime,
    setExactTime: setExactTimeStore,
    setTimerMode: setTimerModeStore,
    setIndefinite: setIndefiniteStore,
    toggleLock,
  };
};
