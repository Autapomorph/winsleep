import { useCallback } from 'react';

import { useTimer, useTimerExecution } from '@/features/manage-timer';
import { logger } from '@/shared/lib';

export const useTimerOrchestrator = () => {
  const { execute } = useTimerExecution();

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
    setTimerMode,
    setIndefinite,
    increaseTime,
    decreaseTime,
  } = useTimer();

  let currentSeconds: number;
  if (timerMode === 'indefinite') {
    currentSeconds = 0;
  } else if (timerState === 'idle') {
    currentSeconds = plannedSeconds;
  } else {
    currentSeconds = remainingSeconds;
  }

  const isIndefiniteMode = timerMode === 'indefinite';

  const executeImmediately = useCallback(() => {
    if (timerState !== 'running') {
      return;
    }

    logger.info('Executing timer action immediately (manual override)');

    cancel();
    execute();
  }, [timerState, cancel, execute]);

  return {
    currentSeconds,
    effectiveTimerState: timerState,
    isIndefiniteMode,
    timerState,
    timerMode,
    plannedSeconds,
    remainingSeconds,
    targetDateTime,
    isLocked,
    increaseTime,
    decreaseTime,
    handleStart: start,
    handlePause: pause,
    handleResume: resume,
    handleCancel: cancel,
    handleSetExactTime: setExactTime,
    handleSetIndefinite: setIndefinite,
    setTimerMode,
    executeImmediately,
  };
};
