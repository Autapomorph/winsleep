import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type TimerAction, DEFAULT_TIMER_ACTION } from '@/shared/config';

type SessionStore = SessionState & SessionActions;

interface SessionState {
  isInitialized: boolean;
  timerAction: TimerAction;
  isLocked: boolean;
}

interface SessionActions {
  setIsInitialized: (val: boolean) => void;
  setTimerAction: (action: TimerAction) => void;
  setIsLocked: (val: boolean) => void;
  toggleLock: () => void;
}

const initialState: SessionState = {
  isInitialized: false,
  timerAction: DEFAULT_TIMER_ACTION,
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

  setTimerAction: timerAction => set({ timerAction }, false, 'session/setTimerAction'),

  setIsLocked: isLocked => set({ isLocked }, false, 'session/setIsLocked'),

  toggleLock: () => set(state => ({ isLocked: !state.isLocked }), false, 'session/toggleLock'),
});

export const useSessionStore = create<SessionStore>()(
  devtools(sessionSlice, {
    name: 'session',
  }),
);
