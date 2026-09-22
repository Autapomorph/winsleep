import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  type ActiveScheduledTimerState,
  type ScheduledTimerActions,
  type ScheduledTimerSlice,
  type ScheduledTimerState,
  createScheduledTimerSlice,
} from './slices/scheduledTimer.slice';
import {
  type UpdaterAppActions,
  type UpdaterAppState,
  type UpdaterAppStateSlice,
  createUpdaterAppSlice,
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
