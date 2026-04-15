import { type TimerAction, TIMER_ACTIONS } from '@/shared/config';

export const isValidTimerAction = (key: unknown): key is TimerAction => {
  return typeof key === 'string' && TIMER_ACTIONS.includes(key as TimerAction);
};
