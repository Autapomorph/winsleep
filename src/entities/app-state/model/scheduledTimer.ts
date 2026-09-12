import { isValidTimerAction } from '@/shared/lib';
import { type ActiveScheduledTimerState } from './appState.store';

export const sanitizeScheduledTimer = (raw: unknown): ActiveScheduledTimerState | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const timerObj = raw as Record<string, unknown>;

  const timerAction = isValidTimerAction(timerObj.timerAction) ? timerObj.timerAction : null;
  const armedAt =
    typeof timerObj.armedAt === 'number' && Number.isFinite(timerObj.armedAt)
      ? timerObj.armedAt
      : null;

  if (timerAction === null || armedAt === null) {
    return null;
  }

  if (timerObj.targetDateTime === null) {
    if (timerAction !== 'keep-awake') {
      return null;
    }

    return {
      armedAt,
      timerAction: 'keep-awake',
      targetDateTime: null,
    };
  }

  if (typeof timerObj.targetDateTime !== 'number' || !Number.isFinite(timerObj.targetDateTime)) {
    return null;
  }

  return {
    armedAt,
    timerAction,
    targetDateTime: timerObj.targetDateTime,
  };
};
