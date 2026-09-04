import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type ActiveScheduledTimerState,
  type ScheduledTimerActions,
  type ScheduledTimerSlice,
  type ScheduledTimerState,
  createScheduledTimerSlice,
  initialScheduledTimerState,
} from './slices/scheduledTimer.slice';
import {
  type UpdaterAppActions,
  type UpdaterAppState,
  type UpdaterAppStateSlice,
  createUpdaterAppSlice,
  initialUpdaterAppState,
} from './slices/updaterAppState.slice';

export type {
  ActiveScheduledTimerState,
  ScheduledTimerActions,
  ScheduledTimerSlice,
  ScheduledTimerState,
  UpdaterAppActions,
  UpdaterAppState,
  UpdaterAppStateSlice,
};

export type AppStateStore = ScheduledTimerSlice & UpdaterAppStateSlice;

export type AppStateState = ScheduledTimerState & UpdaterAppState;

export const initialAppState: AppStateState = {
  ...initialScheduledTimerState,
  ...initialUpdaterAppState,
};

export const useAppStateStore = create<AppStateStore>()(
  devtools(
    (...a) => ({
      ...createScheduledTimerSlice(...a),
      ...createUpdaterAppSlice(...a),
    }),
    {
      name: 'app-state',
    },
  ),
);
