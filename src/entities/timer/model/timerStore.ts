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
  timeoutId: number | null;
  isListenersInitialized: boolean;
  onCompleteCallback: (() => void) | null;
}

interface TimerActions {
  setOnComplete: (cb: () => void) => void;
  start: (onComplete: () => void) => void;
  pause: () => void;
  resume: (onComplete: () => void) => void;
  cancel: () => void;
  increaseTime: (step?: number) => void;
  decreaseTime: (step?: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setExactTime: (seconds: number) => void;
  setTargetDateTime: (timestamp: number | null) => void;
  restoreScheduledTimer: (targetDateTime: number, onComplete?: () => void) => void;
}

const initialState: TimerStoreState = {
  timerState: 'idle',
  timerMode: 'duration',
  targetDateTime: null,
  plannedSeconds: DEFAULT_TIMER_SECONDS,
  remainingSeconds: DEFAULT_TIMER_SECONDS,
  endTime: null,
  timeoutId: null,
  isListenersInitialized: false,
  onCompleteCallback: null,
};

const timerSlice: StateCreator<TimerStore, [['zustand/devtools', never]], [], TimerStore> = (
  set,
  get,
) => ({
  ...initialState,

  setOnComplete: cb => {
    set({ onCompleteCallback: cb }, false, 'timer/setOnComplete');
  },

  start: onComplete => {
    const { timerState, timerMode, targetDateTime, plannedSeconds } = get();

    if (timerState !== 'idle') {
      return;
    }

    let actualSeconds = plannedSeconds;
    if (timerMode === 'timestamp' && targetDateTime) {
      actualSeconds = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    }

    logger.info(`Timer started with planned duration: ${actualSeconds}s (mode: ${timerMode})`);

    set({ onCompleteCallback: onComplete }, false, 'timer/start');

    const endTime =
      timerMode === 'timestamp' && targetDateTime
        ? targetDateTime
        : getDateNow() + actualSeconds * 1000;
    set({ timerState: 'running', remainingSeconds: actualSeconds, endTime }, false, 'timer/start');

    typedInvoke('start_timer', {
      durationMs: actualSeconds * 1000,
      targetTimestampMs: timerMode === 'timestamp' ? targetDateTime : null,
    }).catch(err => {
      logger.error(`Failed to start backend timer: ${err}`);
    });
  },

  pause: () => {
    const { timerState, timerMode, endTime } = get();

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
        timerState: 'paused',
        remainingSeconds: remainingSecs,
        endTime: null,
        timeoutId: null,
      },
      false,
      'timer/pause',
    );
  },

  resume: onComplete => {
    const { timerState, remainingSeconds } = get();

    if (timerState !== 'paused') {
      return;
    }

    logger.info(`Timer resumed with ${remainingSeconds}s remaining`);
    set({ onCompleteCallback: onComplete }, false, 'timer/resume');
    const endTime = getDateNow() + remainingSeconds * 1000;
    set({ timerState: 'running', endTime }, false, 'timer/resume');

    typedInvoke('start_timer', {
      durationMs: Math.round(remainingSeconds * 1000),
      targetTimestampMs: null,
    }).catch(err => {
      logger.error(`Failed to resume backend timer: ${err}`);
    });
  },

  cancel: () => {
    const { plannedSeconds, timerState, timerMode, targetDateTime } = get();

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
        timerState: 'idle',
        plannedSeconds: clampedPlanned,
        remainingSeconds: clampedPlanned,
        endTime: null,
        timeoutId: null,
      },
      false,
      'timer/cancel',
    );
  },

  increaseTime: step => {
    if (get().timerMode === 'timestamp') {
      return;
    }

    const { timerState, plannedSeconds, remainingSeconds } = get();
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
    set({ remainingSeconds: newRemaining, endTime }, false, 'timer/increaseTime');

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

    const { timerState, plannedSeconds, remainingSeconds } = get();
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
    set({ remainingSeconds: newRemaining, endTime }, false, 'timer/decreaseTime');

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
          timerMode: 'duration',
          targetDateTime: null,
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
        },
        false,
        'timer/setExactTime',
      );
    } else {
      logger.info(`Timer remaining duration set to: ${validSeconds}s`);
      const endTime = getDateNow() + validSeconds * 1000;
      set(
        {
          timerMode: 'duration',
          targetDateTime: null,
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
          endTime,
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
    set({ targetDateTime: timestamp }, false, 'timer/setTargetDateTime');

    if (timestamp && get().timerState === 'idle') {
      const seconds = Math.max(0, Math.ceil((timestamp - getDateNow()) / 1000));
      set({ plannedSeconds: seconds, remainingSeconds: seconds }, false, 'timer/setTargetDateTime');
    }
  },

  restoreScheduledTimer: (targetDateTime, onComplete) => {
    const actualSeconds = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    logger.info(
      `Restoring scheduled timer with target timestamp: ${targetDateTime} (${actualSeconds}s remaining)`,
    );

    if (onComplete) {
      set({ onCompleteCallback: onComplete }, false, 'timer/restoreScheduledTimer');
    }

    set(
      {
        timerState: 'running',
        timerMode: 'timestamp',
        targetDateTime,
        plannedSeconds: actualSeconds,
        remainingSeconds: actualSeconds,
        endTime: targetDateTime,
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
