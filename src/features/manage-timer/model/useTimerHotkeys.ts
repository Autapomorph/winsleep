import type { TimerMode, TimerState } from '@/entities/timer';
import { SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

interface Params {
  isLocked?: boolean;
  timerState: TimerState;
  timerMode: TimerMode;
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  increaseTime: () => void;
  decreaseTime: () => void;
  executeImmediately: () => void;
  setIsLocked: (isLocked: boolean) => void;
}

export const useTimerHotkeys = ({
  isLocked = false,
  timerState,
  timerMode,
  start,
  pause,
  resume,
  cancel,
  increaseTime,
  decreaseTime,
  executeImmediately,
  setIsLocked,
}: Params) => {
  useAppHotkey(SHORTCUTS.TIMER.START_PAUSE_RESUME, async () => {
    if (isLocked) {
      return;
    }

    if (timerState === 'idle') {
      start();
      return;
    }

    if (timerState === 'running') {
      pause();
      return;
    }

    resume();
  });

  useAppHotkey(SHORTCUTS.TIMER.CANCEL, cancel, {
    enabled: !isLocked && timerState !== 'idle',
  });

  useAppHotkey(SHORTCUTS.TIMER.INCREASE, increaseTime, {
    enabled: !isLocked && timerMode !== 'timestamp',
  });

  useAppHotkey(SHORTCUTS.TIMER.DECREASE, decreaseTime, {
    enabled: !isLocked && timerMode !== 'timestamp',
  });

  useAppHotkey(SHORTCUTS.TIMER.INSTANT_EXECUTE, executeImmediately, {
    enabled: isLocked && timerState === 'running',
  });

  useAppHotkey(SHORTCUTS.TIMER.LOCK_SETTINGS, () => setIsLocked(!isLocked));
};
