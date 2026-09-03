import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type TimerAction } from '@/shared/config';

export type AppStateStore = ScheduledTimerSlice;

export type AppStateState = ScheduledTimerState;

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

const initialScheduledTimerState: ScheduledTimerState = {
  scheduledTimer: null,
};

const initialState: AppStateState = {
  ...initialScheduledTimerState,
};

const createScheduledTimerSlice: StateCreator<
  AppStateStore,
  [['zustand/devtools', never]],
  [],
  ScheduledTimerSlice
> = set => ({
  ...initialState,
  setScheduledTimer: scheduledTimer =>
    set({ scheduledTimer }, false, 'app-state/setScheduledTimer'),
  clearScheduledTimer: () => set({ scheduledTimer: null }, false, 'app-state/clearScheduledTimer'),
});

export const useAppStateStore = create<AppStateStore>()(
  devtools(
    (...a) => ({
      ...createScheduledTimerSlice(...a),
    }),
    {
      name: 'app-state',
    },
  ),
);
