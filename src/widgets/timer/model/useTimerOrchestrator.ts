import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTimer } from '@/features/manage-timer';
import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { logger } from '@/shared/lib';

interface Props {
  onComplete: () => void;
}

export const useTimerOrchestrator = ({ onComplete }: Props) => {
  const action = useSessionStore(state => state.timerAction);

  const {
    timerState,
    timerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    isLocked,
    start,
    pause,
    resume,
    cancel,
    setExactTime,
    increaseTime,
    decreaseTime,
  } = useTimer({ onComplete });

  const { isIndefiniteActive, startIndefinite, stopIndefinite } = useKeepAwakeStore(
    useShallow(state => ({
      isIndefiniteActive: state.isIndefiniteActive,
      startIndefinite: state.startIndefinite,
      stopIndefinite: state.stopIndefinite,
    })),
  );

  const isIndefiniteRunning = action === 'keep-awake' && isIndefiniteActive;

  let currentSeconds: number;
  if (isIndefiniteRunning) {
    currentSeconds = 0;
  } else if (timerState === 'idle') {
    currentSeconds = plannedSeconds;
  } else {
    currentSeconds = remainingSeconds;
  }

  const isIndefiniteMode = action === 'keep-awake' && (isIndefiniteActive || currentSeconds === 0);

  let effectiveTimerState = timerState;
  if (isIndefiniteMode) {
    effectiveTimerState = isIndefiniteActive ? 'running' : 'idle';
  }

  const effectiveTimerMode = isIndefiniteMode ? 'timestamp' : timerMode;

  useEffect(() => {
    if (action !== 'keep-awake' && isIndefiniteActive) {
      stopIndefinite();
    }
  }, [action, isIndefiniteActive, stopIndefinite]);

  const handleStart = useCallback(() => {
    if (action === 'keep-awake' && currentSeconds === 0) {
      startIndefinite();
      return;
    }

    start();
  }, [action, currentSeconds, startIndefinite, start]);

  const handlePause = useCallback(() => {
    if (isIndefiniteActive) {
      stopIndefinite();
      return;
    }

    pause();
  }, [isIndefiniteActive, stopIndefinite, pause]);

  const handleResume = useCallback(() => {
    if (action === 'keep-awake' && currentSeconds === 0) {
      startIndefinite();
      return;
    }

    resume();
  }, [action, currentSeconds, startIndefinite, resume]);

  const handleCancel = useCallback(() => {
    if (isIndefiniteActive) {
      stopIndefinite();
    }

    cancel();
  }, [isIndefiniteActive, stopIndefinite, cancel]);

  const executeImmediately = useCallback(() => {
    if (isIndefiniteActive) {
      stopIndefinite();
      return;
    }

    if (timerState !== 'running') {
      return;
    }

    logger.info('Executing timer action immediately (manual override)');

    cancel();
    onComplete();
  }, [isIndefiniteActive, stopIndefinite, timerState, cancel, onComplete]);

  const handleSetExactTime = useCallback(
    (seconds: number) => {
      if (action === 'keep-awake') {
        if (seconds === 0) {
          if (timerState === 'running') {
            cancel();
            setExactTime(0);
            startIndefinite();
            return;
          }

          if (timerState === 'paused') {
            cancel();
            setExactTime(0);
            return;
          }

          if (isIndefiniteActive) {
            return;
          }

          setExactTime(0);
          return;
        }

        if (isIndefiniteActive) {
          stopIndefinite();
          setExactTime(seconds);
          start();
          return;
        }
      }

      setExactTime(seconds);
    },
    [
      action,
      timerState,
      isIndefiniteActive,
      cancel,
      setExactTime,
      startIndefinite,
      stopIndefinite,
      start,
    ],
  );

  return {
    currentSeconds,
    effectiveTimerState,
    isIndefiniteMode,
    timerState,
    timerMode: effectiveTimerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    isLocked,
    increaseTime,
    decreaseTime,
    handleStart,
    handlePause,
    handleResume,
    handleCancel,
    handleSetExactTime,
    executeImmediately,
  };
};
