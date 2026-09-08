export type TimerAction = 'sleep' | 'hibernate' | 'shutdown' | 'reboot' | 'lock' | 'signout';

export const TIMER_ACTIONS: TimerAction[] = [
  'sleep',
  'hibernate',
  'shutdown',
  'reboot',
  'lock',
  'signout',
] as const;

export const FORCE_CAPABLE_TIMER_ACTIONS: readonly TimerAction[] = [
  'shutdown',
  'reboot',
  'signout',
] as const;

export const DEFAULT_TIMER_ACTION: TimerAction = 'sleep';

export const DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION = false;

export const DEFAULT_IS_FORCE_ACTION_ENABLED = false;
