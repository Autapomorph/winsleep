import { type ActiveScheduledTimerState, type AppStateState } from './appStateStore';
import { CURRENT_APP_STATE_VERSION } from './migrate';

export interface SerializedAppState {
  [key: string]: unknown;
  version: number;
  scheduledTimer: ActiveScheduledTimerState | null;
}

export const serializeAppState = (state: AppStateState): SerializedAppState => {
  return {
    version: CURRENT_APP_STATE_VERSION,
    scheduledTimer: state.scheduledTimer,
  };
};
