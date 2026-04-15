export type TimerAction = 'sleep' | 'hibernate' | 'shutdown' | 'reboot' | 'lock' | 'signout';

export const TIMER_ACTIONS: TimerAction[] = [
  'sleep',
  'hibernate',
  'shutdown',
  'reboot',
  'lock',
  'signout',
] as const;

export const DEFAULT_TIMER_ACTION: TimerAction = 'sleep';

export const DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION = false;
