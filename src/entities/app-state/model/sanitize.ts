import { CURRENT_APP_STATE_VERSION } from './migrate';
import { sanitizeScheduledTimer } from './scheduledTimer';
import { type SerializedAppState } from './serialize';

export const DEFAULT_SERIALIZED_APP_STATE: SerializedAppState = {
  version: CURRENT_APP_STATE_VERSION,
  scheduledTimer: null,
};

export const sanitizeAppState = (rawState: Record<string, unknown>): SerializedAppState => {
  if (!rawState || typeof rawState !== 'object') {
    return DEFAULT_SERIALIZED_APP_STATE;
  }

  // Sanitize version
  const version =
    typeof rawState.version === 'number' ? rawState.version : CURRENT_APP_STATE_VERSION;

  // Sanitize scheduledTimer
  const scheduledTimer = sanitizeScheduledTimer(rawState.scheduledTimer);

  return {
    version,
    scheduledTimer,
  };
};
