import { type StateCreator } from 'zustand';

import { type TimerAction } from '@/shared/config';
import { type AppStateStore } from '../appState.store';

export type ScheduledTimerSlice = ScheduledTimerActions & ScheduledTimerState;

export interface ScheduledTimerState {
  scheduledTimer: ActiveScheduledTimerState | null;
}

export interface ActiveScheduledTimerState {
  armedAt: number;
  targetDateTime: number;
  timerAction: TimerAction;
}

export interface ScheduledTimerActions {
  clearScheduledTimer: () => void;
  setScheduledTimer: (scheduledTimer: ActiveScheduledTimerState) => void;
}

export const initialScheduledTimerState: ScheduledTimerState = {
  scheduledTimer: null,
};

export const createScheduledTimerSlice: StateCreator<
  AppStateStore,
  [['zustand/devtools', never]],
  [],
  ScheduledTimerSlice
> = set => ({
  ...initialScheduledTimerState,

  clearScheduledTimer: () => {
    set({ scheduledTimer: null }, false, 'app-state/clearScheduledTimer');
  },

  setScheduledTimer: scheduledTimer => {
    set({ scheduledTimer }, false, 'app-state/setScheduledTimer');
  },
});
