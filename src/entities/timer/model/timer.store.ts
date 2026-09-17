import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { typedInvoke } from '@/shared/api';
import { DEFAULT_TIMER_SECONDS, DEFAULT_TIMER_STEP_SECONDS } from '@/shared/config';
import { getDateNow, logger } from '@/shared/lib';
import { type TimerMode, type TimerState, MAX_SECONDS, MIN_SECONDS } from './timer';

export type TimerStore = TimerStoreState & TimerActions;

export interface TimerStoreState {
  timerState: TimerState;
  timerMode: TimerMode;
  targetDateTime: number | null;
  plannedSeconds: number;
  remainingSeconds: number;
  endTime: number | null;
  isListenersInitialized: boolean;
}

export interface TimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  increaseTime: (step?: number) => void;
  decreaseTime: (step?: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setExactTime: (seconds: number) => void;
  setTargetDateTime: (timestamp: number | null) => void;
  setIndefinite: () => void;
  resetToDefaultDuration: (defaultSeconds?: number) => void;
  restoreScheduledTimer: (targetDateTime: number) => void;
  restoreIndefiniteTimer: () => void;
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

    if (timerMode === 'indefinite') {
      logger.info('Timer started in indefinite mode');
      typedInvoke('cancel_timer').catch(err => {
        logger.error(`Failed to cancel backend timer on indefinite start: ${err}`);
      });
      set(
        {
          endTime: null,
          remainingSeconds: 0,
          timerState: 'running',
        },
        false,
        'timer/start',
      );

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

    if (timerState !== 'running' || timerMode !== 'duration' || !endTime) {
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
    const { remainingSeconds, timerMode, timerState } = get();

    if (timerState !== 'paused' || timerMode !== 'duration') {
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
    if (timerMode === 'indefinite') {
      clampedPlanned = 0;
    } else if (timerMode === 'timestamp' && targetDateTime) {
      clampedPlanned = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
    } else if (timerMode === 'duration') {
      clampedPlanned = Math.min(plannedSeconds, MAX_SECONDS);
    }

    set(
      {
        endTime: null,
        plannedSeconds: timerMode === 'indefinite' ? plannedSeconds : clampedPlanned,
        remainingSeconds: clampedPlanned,
        timerState: 'idle',
      },
      false,
      'timer/cancel',
    );
  },

  increaseTime: step => {
    if (get().timerMode !== 'duration') {
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
    if (get().timerMode !== 'duration') {
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
    const { plannedSeconds, remainingSeconds, targetDateTime, timerMode, timerState } = get();

    if (mode === timerMode) {
      return;
    }

    // Transition rule 1: If timer was paused in duration, switching to timestamp or indefinite causes idle
    if (timerState === 'paused') {
      logger.info(
        `Timer switched mode from ${timerMode} to ${mode} while paused -> transitioning to idle`,
      );
      typedInvoke('cancel_timer').catch(err => {
        logger.error(`Failed to cancel backend timer on mode switch: ${err}`);
      });

      if (mode === 'indefinite') {
        set(
          {
            endTime: null,
            plannedSeconds: 0,
            remainingSeconds: 0,
            targetDateTime: null,
            timerMode: 'indefinite',
            timerState: 'idle',
          },
          false,
          'timer/setTimerMode',
        );

        return;
      }

      if (mode === 'timestamp') {
        const timestamp = targetDateTime ?? getDateNow() + 30 * 60 * 1000;
        const seconds = Math.max(0, Math.ceil((timestamp - getDateNow()) / 1000));
        set(
          {
            endTime: null,
            plannedSeconds: seconds,
            remainingSeconds: seconds,
            targetDateTime: timestamp,
            timerMode: 'timestamp',
            timerState: 'idle',
          },
          false,
          'timer/setTimerMode',
        );

        return;
      }

      // mode === 'duration'
      set(
        {
          endTime: null,
          remainingSeconds: plannedSeconds,
          targetDateTime: null,
          timerMode: 'duration',
          timerState: 'idle',
        },
        false,
        'timer/setTimerMode',
      );

      return;
    }

    // Transition rule 2 & 3: If timer was running, switching mode immediately starts/runs in the new mode
    if (timerState === 'running') {
      logger.info(
        `Timer switched mode from ${timerMode} to ${mode} while running -> continuing running in ${mode}`,
      );

      if (mode === 'indefinite') {
        typedInvoke('cancel_timer').catch(err => {
          logger.error(`Failed to cancel backend countdown on indefinite mode: ${err}`);
        });

        set(
          {
            endTime: null,
            plannedSeconds: 0,
            remainingSeconds: 0,
            targetDateTime: null,
            timerMode: 'indefinite',
            timerState: 'running',
          },
          false,
          'timer/setTimerMode',
        );

        return;
      }

      if (mode === 'timestamp') {
        const fallbackTimestamp =
          getDateNow() + Math.round((remainingSeconds > 0 ? remainingSeconds : 30 * 60) * 1000);
        const timestamp =
          targetDateTime && targetDateTime > getDateNow() ? targetDateTime : fallbackTimestamp;
        const seconds = Math.max(0, Math.ceil((timestamp - getDateNow()) / 1000));

        set(
          {
            endTime: timestamp,
            plannedSeconds: seconds,
            remainingSeconds: seconds,
            targetDateTime: timestamp,
            timerMode: 'timestamp',
            timerState: 'running',
          },
          false,
          'timer/setTimerMode',
        );

        typedInvoke('start_timer', {
          durationMs: seconds * 1000,
          targetTimestampMs: timestamp,
        }).catch(err => {
          logger.error(`Failed to start backend timer on switch to timestamp: ${err}`);
        });

        return;
      }

      // mode === 'duration'
      let durationSecs = plannedSeconds > 0 ? plannedSeconds : DEFAULT_TIMER_SECONDS;
      if (timerMode === 'timestamp' && remainingSeconds > 0) {
        durationSecs = Math.round(remainingSeconds);
      }

      const endTime = getDateNow() + durationSecs * 1000;
      set(
        {
          endTime,
          plannedSeconds: durationSecs,
          remainingSeconds: durationSecs,
          targetDateTime: null,
          timerMode: 'duration',
          timerState: 'running',
        },
        false,
        'timer/setTimerMode',
      );

      typedInvoke('start_timer', {
        durationMs: Math.round(durationSecs * 1000),
        targetTimestampMs: null,
      }).catch(err => {
        logger.error(`Failed to start backend timer on switch to duration: ${err}`);
      });

      return;
    }

    // timerState === 'idle'
    if (mode === 'indefinite') {
      set(
        {
          endTime: null,
          plannedSeconds: 0,
          remainingSeconds: 0,
          targetDateTime: null,
          timerMode: 'indefinite',
        },
        false,
        'timer/setTimerMode',
      );

      return;
    }

    if (mode === 'timestamp') {
      let seconds = plannedSeconds;
      if (targetDateTime) {
        seconds = Math.max(0, Math.ceil((targetDateTime - getDateNow()) / 1000));
      }

      set(
        {
          endTime: null,
          remainingSeconds: seconds,
          timerMode: 'timestamp',
        },
        false,
        'timer/setTimerMode',
      );

      return;
    }

    // mode === 'duration'
    set(
      {
        endTime: null,
        remainingSeconds: plannedSeconds > 0 ? plannedSeconds : DEFAULT_TIMER_SECONDS,
        targetDateTime: null,
        timerMode: 'duration',
      },
      false,
      'timer/setTimerMode',
    );
  },

  setExactTime: seconds => {
    const { timerState } = get();
    const validSeconds = Math.max(0, Math.min(seconds, MAX_SECONDS));

    if (timerState === 'idle') {
      logger.info(`Timer planned duration set to: ${validSeconds}s`);

      set(
        {
          endTime: null,
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
          targetDateTime: null,
          timerMode: 'duration',
          timerState: 'idle',
        },
        false,
        'timer/setExactTime',
      );

      return;
    }

    if (timerState === 'paused') {
      logger.info(`Timer duration updated while paused: ${validSeconds}s`);

      set(
        {
          endTime: null,
          plannedSeconds: validSeconds,
          remainingSeconds: validSeconds,
          targetDateTime: null,
          timerMode: 'duration',
          timerState: 'paused',
        },
        false,
        'timer/setExactTime',
      );

      return;
    }

    // timerState === 'running'
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
          endTime: null,
          plannedSeconds: seconds,
          remainingSeconds: seconds,
          targetDateTime: timestamp,
          timerMode: 'timestamp',
          timerState: 'idle',
        },
        false,
        'timer/setTargetDateTime',
      );

      return;
    }

    if (timerState === 'paused') {
      logger.info(`Timer reset from paused to idle with target timestamp: ${timestamp}`);

      set(
        {
          endTime: null,
          plannedSeconds: seconds,
          remainingSeconds: seconds,
          targetDateTime: timestamp,
          timerMode: 'timestamp',
          timerState: 'idle',
        },
        false,
        'timer/setTargetDateTime',
      );

      return;
    }

    // timerState === 'running'
    logger.info(`Timer target timestamp updated to: ${timestamp} (${seconds}s remaining)`);
    set(
      {
        endTime: timestamp,
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
  },

  setIndefinite: () => {
    get().setTimerMode('indefinite');
  },

  resetToDefaultDuration: defaultSeconds => {
    const seconds = defaultSeconds ?? DEFAULT_TIMER_SECONDS;
    typedInvoke('cancel_timer').catch(err => {
      logger.error(`Failed to cancel backend timer on resetToDefaultDuration: ${err}`);
    });

    set(
      {
        endTime: null,
        plannedSeconds: seconds,
        remainingSeconds: seconds,
        targetDateTime: null,
        timerMode: 'duration',
        timerState: 'idle',
      },
      false,
      'timer/resetToDefaultDuration',
    );
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

  restoreIndefiniteTimer: () => {
    logger.info('Restoring indefinite timer from disk');

    typedInvoke('cancel_timer').catch(err => {
      logger.error(`Failed to cancel backend timer on restoreIndefiniteTimer: ${err}`);
    });

    set(
      {
        endTime: null,
        plannedSeconds: 0,
        remainingSeconds: 0,
        targetDateTime: null,
        timerMode: 'indefinite',
        timerState: 'running',
      },
      false,
      'timer/restoreIndefiniteTimer',
    );
  },
});

export const useTimerStore = create<TimerStore>()(
  devtools(timerSlice, {
    name: 'timer',
  }),
);
