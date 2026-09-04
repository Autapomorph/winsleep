import { type StateCreator } from 'zustand';

import {
  type TimerAction,
  DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
  DEFAULT_TIMER_ACTION,
} from '@/shared/config';
import { type SettingsStore } from '../settings.store';

export type TimerActionSlice = TimerActionState & TimerActionActions;

export interface TimerActionState {
  defaultTimerAction: TimerAction;
  shouldRememberSelectedTimerAction: boolean;
}

export interface TimerActionActions {
  setDefaultTimerAction: (defaultTimerAction: TimerAction) => void;
  setShouldRememberSelectedTimerAction: (shouldRememberSelectedTimerAction: boolean) => void;
}

export const initialActionState: TimerActionState = {
  defaultTimerAction: DEFAULT_TIMER_ACTION,
  shouldRememberSelectedTimerAction: DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
};

export const createActionSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  TimerActionSlice
> = set => ({
  ...initialActionState,

  setDefaultTimerAction: defaultTimerAction =>
    set({ defaultTimerAction }, false, 'settings/setDefaultTimerAction'),

  setShouldRememberSelectedTimerAction: shouldRememberSelectedTimerAction =>
    set(
      { shouldRememberSelectedTimerAction },
      false,
      'settings/setShouldRememberSelectedTimerAction',
    ),
});
