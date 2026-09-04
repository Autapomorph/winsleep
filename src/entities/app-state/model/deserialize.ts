import { type AppStateState } from './appStateStore';
import { sanitizeAppState } from './sanitize';

export const deserializeAppState = (rawState: Record<string, unknown>): AppStateState => {
  const cleanState = sanitizeAppState(rawState);

  return {
    scheduledTimer: cleanState.scheduledTimer,
    lastUpdateCheckAt: cleanState.lastUpdateCheckAt,
  };
};
