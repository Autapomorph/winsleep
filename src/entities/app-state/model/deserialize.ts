import { type AppStateState } from './appState.store';
import { sanitizeAppState } from './sanitize';

export const deserializeAppState = (rawState: Record<string, unknown>): AppStateState => {
  const cleanState = sanitizeAppState(rawState);

  return {
    scheduledTimer: cleanState.scheduledTimer,
    lastUpdateCheckAt: cleanState.lastUpdateCheckAt,
  };
};
