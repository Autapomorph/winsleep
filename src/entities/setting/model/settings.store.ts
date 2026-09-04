import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type TimerActionActions,
  type TimerActionSlice,
  type TimerActionState,
  createActionSlice,
  initialActionState,
} from './slices/action.slice';
import { type GeneralActions, type GeneralSlice, createGeneralSlice } from './slices/general.slice';
import {
  type NotificationActions,
  type NotificationSlice,
  type NotificationState,
  createNotificationSlice,
  initialNotificationState,
} from './slices/notification.slice';
import {
  type SystemActions,
  type SystemSlice,
  type SystemState,
  createSystemSlice,
  initialSystemState,
} from './slices/system.slice';
import {
  type TimerActions,
  type TimerSlice,
  type TimerState,
  createTimerSlice,
  initialTimerState,
} from './slices/timer.slice';

export type {
  GeneralActions,
  GeneralSlice,
  NotificationActions,
  NotificationSlice,
  NotificationState,
  SystemActions,
  SystemSlice,
  SystemState,
  TimerActionActions,
  TimerActions,
  TimerActionSlice,
  TimerActionState,
  TimerSlice,
  TimerState,
};

export type SettingsStore = TimerActionSlice &
  TimerSlice &
  NotificationSlice &
  SystemSlice &
  GeneralSlice;

export type SettingsState = TimerActionState & TimerState & NotificationState & SystemState;

export const initialSettingsState: SettingsState = {
  ...initialActionState,
  ...initialTimerState,
  ...initialNotificationState,
  ...initialSystemState,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (...a) => ({
      ...createActionSlice(...a),
      ...createTimerSlice(...a),
      ...createNotificationSlice(...a),
      ...createSystemSlice(...a),
      ...createGeneralSlice(...a),
    }),
    {
      name: 'settings',
    },
  ),
);
