import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { typedInvoke } from '@/shared/api';
import { DEFAULT_TIMER_SECONDS, DEFAULT_TIMER_STEP_SECONDS } from '@/shared/config';
import { getDateNow, logger } from '@/shared/lib';
import { type TimerMode, type TimerState, MAX_SECONDS, MIN_SECONDS } from './timer';

type TimerStore = TimerStoreState & TimerActions;

interface TimerStoreState {
  timerState: TimerState;
  timerMode: TimerMode;
  targetDateTime: number | null;
  plannedSeconds: number;
  remainingSeconds: number;
  endTime: number | null;
  isListenersInitialized: boolean;
}

interface TimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  increaseTime: (step?: number) => void;
  decreaseTime: (step?: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setExactTime: (seconds: number) => void;
  setTargetDateTime: (timestamp: number | null) => void;
  restoreScheduledTimer: (targetDateTime: number) => void;
}

const initialState: TimerStoreState = {
  timerState: 'idle',
  timerMode: 'duration',
  targetDateTime: null,
  plannedSeconds: DEFAULT_TIMER_SECONDS,
  remainingSeconds: DEFAULT_TIMER_SECONDS,
  endTime: null,
  isListenersInitialized: false,
};

const timerSlice: StateCreator<TimerStore, [['zustand/devtools', never]], [], TimerStore> = (
  set,
  get,
) => ({
  ...initialState,

  start: () => {
    const { plannedSeconds, targetDateTime, timerMode, timerState } = get();

    if (timerState !== 'idle') {
      return;
    }

    let actualSeconds = plannedSeconds;
    if (timerMode === 'timestamp' && targetDateTime) {
      actualSeconds = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    }

    logger.info(`Timer started with planned duration: ${actualSeconds}s (mode: ${timerMode})`);

    const endTime =
      timerMode === 'timestamp' && targetDateTime
        ? targetDateTime
        : getDateNow() + actualSeconds * 1000;
    set({ endTime, remainingSeconds: actualSeconds, timerState: 'running' }, false, 'timer/start');

    typedInvoke('start_timer', {
      durationMs: actualSeconds * 1000,
      targetTimestampMs: timerMode === 'timestamp' ? targetDateTime : null,
    }).catch(err => {
      logger.error(`Failed to start backend timer: ${err}`);
    });
  },

  pause: () => {
    const { endTime, timerMode, timerState } = get();

    if (timerState !== 'running' || !endTime) {
      return;
    }

    if (timerMode === 'timestamp') {
      get().cancel();
      return;
    }

    typedInvoke('cancel_timer').catch(err => {
      logger.error(`Failed to cancel backend timer on pause: ${err}`);
    });

    const remaining = Math.max(0, endTime - getDateNow());
    const remainingSecs = remaining / 1000;
    logger.info(`Timer paused with ${remainingSecs}s remaining`);
    set(
      {
        endTime: null,
        remainingSeconds: remainingSecs,
        timerState: 'paused',
      },
      false,
      'timer/pause',
    );
  },

  resume: () => {
    const { remainingSeconds, timerState } = get();

    if (timerState !== 'paused') {
      return;
    }

    logger.info(`Timer resumed with ${remainingSeconds}s remaining`);
    const endTime = getDateNow() + remainingSeconds * 1000;
    set({ endTime, timerState: 'running' }, false, 'timer/resume');

    typedInvoke('start_timer', {
      durationMs: Math.round(remainingSeconds * 1000),
      targetTimestampMs: null,
    }).catch(err => {
      logger.error(`Failed to resume backend timer: ${err}`);
    });
  },

  cancel: () => {
    const { plannedSeconds, targetDateTime, timerMode, timerState } = get();

    typedInvoke('cancel_timer').catch(err => {
      logger.error(`Failed to cancel backend timer: ${err}`);
    });

    if (timerState !== 'idle') {
      logger.info('Timer cancelled');
    }

    let clampedPlanned = plannedSeconds;
    if (timerMode === 'timestamp' && targetDateTime) {
      clampedPlanned = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    } else if (timerMode === 'duration') {
      clampedPlanned = Math.min(plannedSeconds, MAX_SECONDS);
    }

    set(
      {
        endTime: null,
        plannedSeconds: clampedPlanned,
        remainingSeconds: clampedPlanned,
        timerState: 'idle',
      },
      false,
      'timer/cancel',
    );
  },

  increaseTime: step => {
    if (get().timerMode === 'timestamp') {
      return;
    }

    const { plannedSeconds, remainingSeconds, timerState } = get();
    const stepSeconds = step ?? DEFAULT_TIMER_STEP_SECONDS;

    if (timerState === 'idle') {
      const newPlanned = Math.min(plannedSeconds + stepSeconds, MAX_SECONDS);
      logger.info(`Timer planned duration increased by ${stepSeconds}s. New total: ${newPlanned}s`);
      set(
        { plannedSeconds: newPlanned, remainingSeconds: newPlanned },
        false,
        'timer/increaseTime',
      );

      return;
    }

    const newRemaining = Math.min(MAX_SECONDS, remainingSeconds + stepSeconds);
    logger.info(
      `Timer remaining duration increased by ${stepSeconds}s. New remaining: ${newRemaining}s`,
    );
    const endTime = timerState === 'running' ? getDateNow() + newRemaining * 1000 : get().endTime;
    set({ endTime, remainingSeconds: newRemaining }, false, 'timer/increaseTime');

    if (timerState === 'running') {
      typedInvoke('start_timer', {
        durationMs: Math.round(newRemaining * 1000),
        targetTimestampMs: null,
      }).catch(err => {
        logger.error(`Failed to update backend timer on increase: ${err}`);
      });
    }
  },

  decreaseTime: step => {
    if (get().timerMode === 'timestamp') {
      return;
    }

    const { plannedSeconds, remainingSeconds, timerState } = get();
    const stepSeconds = step ?? DEFAULT_TIMER_STEP_SECONDS;

    if (timerState === 'idle') {
      const newPlanned = Math.max(plannedSeconds - stepSeconds, MIN_SECONDS);
      logger.info(`Timer planned duration decreased by ${stepSeconds}s. New total: ${newPlanned}s`);
      set(
        { plannedSeconds: newPlanned, remainingSeconds: newPlanned },
        false,
        'timer/decreaseTime',
      );

      return;
    }

    const newRemaining = Math.max(MIN_SECONDS, remainingSeconds - stepSeconds);
    const endTime = timerState === 'running' ? getDateNow() + newRemaining * 1000 : get().endTime;
    logger.info(
      `Timer remaining duration decreased by ${stepSeconds}s. New remaining: ${newRemaining}s`,
    );
    set({ endTime, remainingSeconds: newRemaining }, false, 'timer/decreaseTime');

    if (timerState === 'running') {
      typedInvoke('start_timer', {
        durationMs: Math.round(newRemaining * 1000),
        targetTimestampMs: null,
      }).catch(err => {
        logger.error(`Failed to update backend timer on decrease: ${err}`);
      });
    }
  },

  setTimerMode: mode => {
    set({ timerMode: mode }, false, 'timer/setTimerMode');
  },

  setExactTime: seconds => {
    const { timerState } = get();
    const validSeconds = Math.max(0, Math.min(seconds, MAX_SECONDS));

    if (timerState === 'idle') {
      logger.info(`Timer planned duration set to: ${validSeconds}s`);

      set(
        {
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
          targetDateTime: null,
          timerMode: 'duration',
        },
        false,
        'timer/setExactTime',
      );
    } else {
      logger.info(`Timer remaining duration set to: ${validSeconds}s`);
      const endTime = getDateNow() + validSeconds * 1000;
      set(
        {
          endTime,
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
          targetDateTime: null,
          timerMode: 'duration',
          timerState: 'running',
        },
        false,
        'timer/setExactTime',
      );

      typedInvoke('start_timer', {
        durationMs: validSeconds * 1000,
        targetTimestampMs: null,
      }).catch(err => {
        logger.error(`Failed to update backend timer on setExactTime: ${err}`);
      });
    }
  },

  setTargetDateTime: timestamp => {
    const { timerState } = get();

    if (!timestamp) {
      set(
        {
          targetDateTime: null,
        },
        false,
        'timer/setTargetDateTime',
      );

      return;
    }

    const seconds = Math.max(0, Math.ceil((timestamp - getDateNow()) / 1000));

    if (timerState === 'idle') {
      logger.info(`Timer target timestamp set to: ${timestamp} (${seconds}s planned)`);

      set(
        {
          plannedSeconds: seconds,
          remainingSeconds: seconds,
          targetDateTime: timestamp,
          timerMode: 'timestamp',
        },
        false,
        'timer/setTargetDateTime',
      );
    } else {
      logger.info(`Timer target timestamp updated to: ${timestamp} (${seconds}s remaining)`);

      const endTime = timestamp;
      set(
        {
          endTime,
          plannedSeconds: seconds,
          remainingSeconds: seconds,
          targetDateTime: timestamp,
          timerMode: 'timestamp',
          timerState: 'running',
        },
        false,
        'timer/setTargetDateTime',
      );

      typedInvoke('start_timer', {
        durationMs: seconds * 1000,
        targetTimestampMs: timestamp,
      }).catch(err => {
        logger.error(`Failed to update backend timer on setTargetDateTime: ${err}`);
      });
    }
  },

  restoreScheduledTimer: targetDateTime => {
    const actualSeconds = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    logger.info(
      `Restoring scheduled timer with target timestamp: ${targetDateTime} (${actualSeconds}s remaining)`,
    );

    set(
      {
        endTime: targetDateTime,
        plannedSeconds: actualSeconds,
        remainingSeconds: actualSeconds,
        targetDateTime,
        timerMode: 'timestamp',
        timerState: 'running',
      },
      false,
      'timer/restoreScheduledTimer',
    );

    typedInvoke('start_timer', {
      durationMs: actualSeconds * 1000,
      targetTimestampMs: targetDateTime,
    }).catch(err => {
      logger.error(`Failed to start backend timer on restoreScheduledTimer: ${err}`);
    });
  },
});

export const useTimerStore = create<TimerStore>()(
  devtools(timerSlice, {
    name: 'timer',
  }),
);
