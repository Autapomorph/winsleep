import { CURRENT_APP_STATE_VERSION } from './migrate';
import { sanitizeScheduledTimer } from './scheduledTimer';
import { type SerializedAppState } from './serialize';

export const DEFAULT_SERIALIZED_APP_STATE: SerializedAppState = {
  version: CURRENT_APP_STATE_VERSION,
  scheduledTimer: null,
  lastUpdateCheckAt: null,
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

  // Sanitize lastUpdateCheckAt
  const lastUpdateCheckAt =
    typeof rawState.lastUpdateCheckAt === 'number' &&
    Number.isFinite(rawState.lastUpdateCheckAt) &&
    rawState.lastUpdateCheckAt > 0
      ? rawState.lastUpdateCheckAt
      : null;

  return {
    version,
    scheduledTimer,
    lastUpdateCheckAt,
  };
};
