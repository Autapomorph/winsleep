import { isValidTimerAction } from '@/shared/lib';
import { type ActiveScheduledTimerState } from './appStateStore';

export const sanitizeScheduledTimer = (raw: unknown): ActiveScheduledTimerState | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const timerObj = raw as Record<string, unknown>;

  const targetDateTime =
    typeof timerObj.targetDateTime === 'number' && timerObj.targetDateTime > 0
      ? timerObj.targetDateTime
      : null;

  const timerAction = isValidTimerAction(timerObj.timerAction) ? timerObj.timerAction : null;

  const armedAt =
    typeof timerObj.armedAt === 'number' && timerObj.armedAt > 0 ? timerObj.armedAt : null;

  if (targetDateTime === null || timerAction === null || armedAt === null) {
    return null;
  }

  return {
    targetDateTime,
    timerAction,
    armedAt,
  };
};
