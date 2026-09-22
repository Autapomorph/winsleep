import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

type SessionStore = SessionState & SessionActions;

interface SessionState {
  isInitialized: boolean;
  isLocked: boolean;
}

interface SessionActions {
  setIsInitialized: (val: boolean) => void;
  setIsLocked: (val: boolean) => void;
  toggleLock: () => void;
}

const initialState: SessionState = {
  isInitialized: false,
  isLocked: false,
};

const sessionSlice: StateCreator<
  SessionStore,
  [['zustand/devtools', never]],
  [],
  SessionStore
> = set => ({
  ...initialState,

  setIsInitialized: isInitialized => set({ isInitialized }, false, 'session/setIsInitialized'),

  setIsLocked: isLocked => set({ isLocked }, false, 'session/setIsLocked'),

  toggleLock: () => set(state => ({ isLocked: !state.isLocked }), false, 'session/toggleLock'),
});

export const useSessionStore = create<SessionStore>()(
  devtools(sessionSlice, {
    name: 'session',
  }),
);
