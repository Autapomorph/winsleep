import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type KeepAwakeStore = KeepAwakeState & KeepAwakeActions;

export interface KeepAwakeState {
  isIndefiniteActive: boolean;
  startedAt: number | null;
}

export interface KeepAwakeActions {
  startIndefinite: () => void;
  stopIndefinite: () => void;
}

const initialState: KeepAwakeState = {
  isIndefiniteActive: false,
  startedAt: null,
};

const keepAwakeSlice: StateCreator<
  KeepAwakeStore,
  [['zustand/devtools', never]],
  [],
  KeepAwakeStore
> = set => ({
  ...initialState,

  startIndefinite: () =>
    set({ isIndefiniteActive: true, startedAt: Date.now() }, false, 'keep-awake/startIndefinite'),

  stopIndefinite: () =>
    set({ isIndefiniteActive: false, startedAt: null }, false, 'keep-awake/stopIndefinite'),
});

export const useKeepAwakeStore = create<KeepAwakeStore>()(
  devtools(keepAwakeSlice, {
    name: 'keep-awake',
  }),
);
