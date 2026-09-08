import { type StateCreator } from 'zustand';

import {
  type TimerAction,
  DEFAULT_IS_FORCE_ACTION_ENABLED,
  DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
  DEFAULT_TIMER_ACTION,
} from '@/shared/config';
import { type SettingsStore } from '../settings.store';

export type TimerActionSlice = TimerActionState & TimerActionActions;

export interface TimerActionState {
  defaultTimerAction: TimerAction;
  shouldRememberSelectedTimerAction: boolean;
  isForceActionEnabled: boolean;
}

export interface TimerActionActions {
  setDefaultTimerAction: (defaultTimerAction: TimerAction) => void;
  setShouldRememberSelectedTimerAction: (shouldRememberSelectedTimerAction: boolean) => void;
  setIsForceActionEnabled: (isForceActionEnabled: boolean) => void;
}

export const initialActionState: TimerActionState = {
  defaultTimerAction: DEFAULT_TIMER_ACTION,
  shouldRememberSelectedTimerAction: DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
  isForceActionEnabled: DEFAULT_IS_FORCE_ACTION_ENABLED,
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

  setIsForceActionEnabled: isForceActionEnabled =>
    set({ isForceActionEnabled }, false, 'settings/setIsForceActionEnabled'),
});
