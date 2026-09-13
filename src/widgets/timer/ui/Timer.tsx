import { useShallow } from 'zustand/react/shallow';

import {
  TimerControls,
  TimerDisplay,
  TimerPresets,
  TimerTriggerLabel,
  useTimerHotkeys,
} from '@/features/manage-timer';
import { TimerActionSwitch, useTimerActionHotkeys } from '@/features/select-timer-action';
import { useSessionStore } from '@/entities/session';
import { MAX_SECONDS, MIN_SECONDS } from '@/entities/timer';
import { SHORTCUT_SCOPES } from '@/shared/config';
import { useHotkeysScope } from '@/shared/lib';
import { useFormattedTimerTime } from './useFormattedTimerTime';
import { useTimerDefaults } from '../model/useTimerDefaults';
import { useTimerExecution } from '../model/useTimerExecution';
import { useTimerOrchestrator } from '../model/useTimerOrchestrator';

export const Timer = () => {
  const { action, isLocked, setAction, setIsLocked } = useSessionStore(
    useShallow(state => ({
      action: state.timerAction,
      isLocked: state.isLocked,
      setAction: state.setTimerAction,
      setIsLocked: state.setIsLocked,
    })),
  );

  const { execute } = useTimerExecution();

  const {
    currentSeconds,
    effectiveTimerState,
    timerMode,
    targetDateTime,
    increaseTime,
    decreaseTime,
    handleStart,
    handlePause,
    handleResume,
    handleCancel,
    handleSetExactTime,
    executeImmediately,
  } = useTimerOrchestrator({ onComplete: execute });

  const formattedTime = useFormattedTimerTime({
    currentSeconds,
    timerMode,
    targetDateTime,
    timerState: effectiveTimerState,
  });

  useHotkeysScope(SHORTCUT_SCOPES.TIMER);

  useTimerHotkeys({
    isLocked,
    timerState: effectiveTimerState,
    timerMode,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    cancel: handleCancel,
    increaseTime,
    decreaseTime,
    executeImmediately,
    setIsLocked,
  });

  useTimerActionHotkeys({
    isLocked,
    onActionChange: setAction,
  });

  useTimerDefaults({ setExactTime: handleSetExactTime });

  return (
    <div className="grid grid-cols-1 justify-items-center gap-4 py-4">
      <TimerDisplay
        action={action}
        currentSeconds={currentSeconds}
        formattedTime={formattedTime}
        setExactTime={handleSetExactTime}
        increaseTime={increaseTime}
        decreaseTime={decreaseTime}
        isDecreaseAllowed={currentSeconds > MIN_SECONDS}
        isIncreaseAllowed={currentSeconds < MAX_SECONDS}
        isLocked={isLocked}
      />

      <TimerTriggerLabel action={action} currentSeconds={currentSeconds} />

      <TimerActionSwitch action={action} isLocked={isLocked} onActionChange={setAction} />

      <TimerPresets action={action} isLocked={isLocked} setExactTime={handleSetExactTime} />

      <TimerControls
        timerState={effectiveTimerState}
        timerMode={timerMode}
        isLocked={isLocked}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
      />
    </div>
  );
};
