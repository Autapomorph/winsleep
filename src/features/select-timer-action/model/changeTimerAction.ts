import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_TIMER_SECONDS, useTimerStore } from '@/entities/timer';
import type { TimerAction } from '@/shared/config';

export const changeTimerAction = (newAction: TimerAction) => {
  const currentAction = useSessionStore.getState().timerAction;
  if (newAction === currentAction) {
    return;
  }

  const { timerState, timerMode, remainingSeconds } = useTimerStore.getState();
  const { defaultTimerSeconds } = useSettingsStore.getState();
  const defaultSeconds = defaultTimerSeconds ?? DEFAULT_TIMER_SECONDS;

  // Rule 1: Currently keep-awake and indefinite
  if (currentAction === 'keep-awake' && timerMode === 'indefinite') {
    // 1.1 (idle) & 1.2 (running): switch to duration with default time (not now) and set idle
    useTimerStore.getState().resetToDefaultDuration(defaultSeconds);
    useSessionStore.getState().setTimerAction(newAction);
    return;
  }

  // Rule 2: Currently other action, set to now (0) and idle
  if (currentAction !== 'keep-awake' && remainingSeconds === 0 && timerState === 'idle') {
    if (newAction === 'keep-awake') {
      useTimerStore.getState().setIndefinite();
      useSessionStore.getState().setTimerAction(newAction);
      return;
    }
  }

  useSessionStore.getState().setTimerAction(newAction);
};
