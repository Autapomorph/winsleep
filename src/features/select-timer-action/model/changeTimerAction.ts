import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { type TimerAction, DEFAULT_TIMER_SECONDS } from '@/shared/config';

export const changeTimerAction = (newAction: TimerAction) => {
  const { defaultTimerSeconds } = useSettingsStore.getState();
  const defaultSeconds = defaultTimerSeconds ?? DEFAULT_TIMER_SECONDS;

  useTimerStore.getState().setTimerAction(newAction, defaultSeconds);
};
