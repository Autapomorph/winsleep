import { type StateCreator } from 'zustand';

import { initialActionState } from './action.slice';
import { initialNotificationState } from './notification.slice';
import { initialSystemState } from './system.slice';
import { initialTimerState } from './timer.slice';
import { type SettingsStore } from '../settings.store';

export type GeneralSlice = GeneralActions;

export interface GeneralActions {
  resetToDefaults: () => void;
}

export const createGeneralSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  GeneralSlice
> = (set, get) => ({
  resetToDefaults: () =>
    set(
      {
        ...initialActionState,
        ...initialTimerState,
        ...initialNotificationState,
        ...initialSystemState,
        hasSeenTrayNotification: get().hasSeenTrayNotification,
      },
      false,
      'settings/resetToDefaults',
    ),
});
