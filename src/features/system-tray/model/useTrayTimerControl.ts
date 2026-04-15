import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_TIMER_STEP_SECONDS, useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayTimerControl = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTimerStart = typedListen('tray-timer-start-resume-pause-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer start/pause/resume clicked from tray menu');

      const store = useTimerStore.getState();
      const { timerState, start, resume, pause, onCompleteCallback } = store;
      const { isLocked } = useSessionStore.getState();

      if (timerState === 'running') {
        if (isLocked) {
          return;
        }

        pause();
        return;
      }

      if (!onCompleteCallback) {
        logger.warn('Cannot control timer from tray: onCompleteCallback is not set');
        return;
      }

      if (timerState === 'idle') {
        start(onCompleteCallback);
      } else if (timerState === 'paused') {
        if (isLocked) {
          return;
        }

        resume(onCompleteCallback);
      }
    });

    const unlistenTimerCancel = typedListen('tray-timer-cancel-clicked', () => {
      const { isLocked } = useSessionStore.getState();

      if (isLocked) {
        return;
      }

      if (!isActive) {
        return;
      }

      logger.info('Timer cancel clicked from tray menu');

      const { cancel } = useTimerStore.getState();
      cancel();
    });

    const unlistenTimerIncrease = typedListen('tray-timer-increase-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer increase clicked from tray menu');

      const { increaseTime } = useTimerStore.getState();
      const { isCustomTimerStepsEnabled, timerStepIncrease } = useSettingsStore.getState();
      const step = isCustomTimerStepsEnabled ? timerStepIncrease : DEFAULT_TIMER_STEP_SECONDS;
      increaseTime(step);
    });

    const unlistenTimerDecrease = typedListen('tray-timer-decrease-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer decrease clicked from tray menu');

      const { decreaseTime } = useTimerStore.getState();
      const { isCustomTimerStepsEnabled, timerStepDecrease } = useSettingsStore.getState();
      const step = isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS;
      decreaseTime(step);
    });

    const unlistenPresetSelected = typedListen('tray-preset-selected', event => {
      if (!isActive) {
        return;
      }

      const seconds = event.payload;

      logger.info(`Preset clicked from tray menu: ${seconds}s`);
      const { setExactTime } = useTimerStore.getState();
      setExactTime(seconds);
    });

    const unlistenSettingsLockToggle = typedListen('tray-settings-lock-toggle-clicked', () => {
      if (!isActive) {
        return;
      }

      logger.info('Timer lock toggle clicked from tray menu');

      const { toggleLock } = useSessionStore.getState();
      toggleLock();
    });

    return () => {
      isActive = false;
      const unlistenPromises = [
        unlistenTimerStart,
        unlistenTimerCancel,
        unlistenTimerIncrease,
        unlistenTimerDecrease,
        unlistenPresetSelected,
        unlistenSettingsLockToggle,
      ];

      Promise.all(unlistenPromises)
        .then(unlisteners => {
          unlisteners.forEach(unlisten => unlisten());
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray timer control events: ${err}`);
        });
    };
  }, []);
};
