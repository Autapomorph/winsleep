import { useEffect } from 'react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_TIMER_STEP_SECONDS, useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayStepControl = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenTimerIncrease = typedListen('tray-timer-increase-clicked', () => {
      if (!isActive) {
        return;
      }

      if (useKeepAwakeStore.getState().isIndefiniteActive) {
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

      if (useKeepAwakeStore.getState().isIndefiniteActive) {
        return;
      }

      logger.info('Timer decrease clicked from tray menu');

      const { decreaseTime } = useTimerStore.getState();
      const { isCustomTimerStepsEnabled, timerStepDecrease } = useSettingsStore.getState();
      const step = isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS;
      decreaseTime(step);
    });

    return () => {
      isActive = false;
      Promise.all([unlistenTimerIncrease, unlistenTimerDecrease])
        .then(unlisteners => {
          unlisteners.forEach(unlisten => unlisten());
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray timer step events: ${err}`);
        });
    };
  }, []);
};
