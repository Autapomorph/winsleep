import { useEffect } from 'react';

import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { logger } from '@/shared/lib';
import { setKeepAwake } from '../api/keepAwake';

export const useKeepAwakeTimerSync = () => {
  useEffect(() => {
    let lastKeepAwake = false;
    let lastKeepDisplayAwake = false;

    const syncKeepAwakeState = () => {
      const { timerState } = useTimerStore.getState();
      const { isPreventPCSleepDuringTimerEnabled, isPreventDisplaySleepDuringTimerEnabled } =
        useSettingsStore.getState();

      const shouldBeEnabled = timerState === 'running' && isPreventPCSleepDuringTimerEnabled;
      const shouldKeepDisplay = shouldBeEnabled && isPreventDisplaySleepDuringTimerEnabled;

      if (shouldBeEnabled === lastKeepAwake && shouldKeepDisplay === lastKeepDisplayAwake) {
        return;
      }

      lastKeepAwake = shouldBeEnabled;
      lastKeepDisplayAwake = shouldKeepDisplay;

      setKeepAwake({
        isEnabled: shouldBeEnabled,
        keepDisplayAwake: shouldKeepDisplay,
      }).catch(err => {
        logger.error(`Failed to sync keep-awake state: ${err}`);
      });
    };

    // Run initial check
    syncKeepAwakeState();

    const unsubscribeTimer = useTimerStore.subscribe(syncKeepAwakeState);
    const unsubscribeSettings = useSettingsStore.subscribe(syncKeepAwakeState);

    return () => {
      unsubscribeTimer();
      unsubscribeSettings();

      if (lastKeepAwake) {
        setKeepAwake({ isEnabled: false, keepDisplayAwake: false }).catch(err => {
          logger.error(`Failed to release keep-awake on unmount: ${err}`);
        });
      }
    };
  }, []);
};
