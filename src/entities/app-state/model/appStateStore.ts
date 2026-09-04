import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type TimerAction } from '@/shared/config';

export type AppStateStore = ScheduledTimerSlice & UpdaterAppStateSlice;

export type AppStateState = ScheduledTimerState & UpdaterAppState;

export type ScheduledTimerSlice = ScheduledTimerState & ScheduledTimerActions;

export interface ActiveScheduledTimerState {
  targetDateTime: number;
  timerAction: TimerAction;
  armedAt: number;
}

export interface ScheduledTimerState {
  scheduledTimer: ActiveScheduledTimerState | null;
}

export interface ScheduledTimerActions {
  setScheduledTimer: (scheduledTimer: ActiveScheduledTimerState) => void;
  clearScheduledTimer: () => void;
}

export type UpdaterAppStateSlice = UpdaterAppState & UpdaterAppActions;

export interface UpdaterAppState {
  lastUpdateCheckAt: number | null;
}

export interface UpdaterAppActions {
  setLastUpdateCheckAt: (lastUpdateCheckAt: number | null) => void;
}

const initialScheduledTimerState: ScheduledTimerState = {
  scheduledTimer: null,
};

const initialUpdaterAppState: UpdaterAppState = {
  lastUpdateCheckAt: null,
};

const createScheduledTimerSlice: StateCreator<
  AppStateStore,
  [['zustand/devtools', never]],
  [],
  ScheduledTimerSlice
> = set => ({
  ...initialScheduledTimerState,
  setScheduledTimer: scheduledTimer =>
    set({ scheduledTimer }, false, 'app-state/setScheduledTimer'),
  clearScheduledTimer: () => set({ scheduledTimer: null }, false, 'app-state/clearScheduledTimer'),
});

const createUpdaterAppSlice: StateCreator<
  AppStateStore,
  [['zustand/devtools', never]],
  [],
  UpdaterAppStateSlice
> = set => ({
  ...initialUpdaterAppState,
  setLastUpdateCheckAt: lastUpdateCheckAt =>
    set({ lastUpdateCheckAt }, false, 'app-state/setLastUpdateCheckAt'),
});

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
