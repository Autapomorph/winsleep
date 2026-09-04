import { type StateCreator } from 'zustand';

import { type AppStateStore } from '../appState.store';

export type UpdaterAppStateSlice = UpdaterAppActions & UpdaterAppState;

export interface UpdaterAppState {
  lastUpdateCheckAt: number | null;
}

export interface UpdaterAppActions {
  setLastUpdateCheckAt: (lastUpdateCheckAt: number | null) => void;
}

export const initialUpdaterAppState: UpdaterAppState = {
  lastUpdateCheckAt: null,
};

export const createUpdaterAppSlice: StateCreator<
  AppStateStore,
  [['zustand/devtools', never]],
  [],
  UpdaterAppStateSlice
> = set => ({
  ...initialUpdaterAppState,

  setLastUpdateCheckAt: lastUpdateCheckAt => {
    set({ lastUpdateCheckAt }, false, 'app-state/setLastUpdateCheckAt');
  },
});
