import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { useTimerStore } from '@/entities/timer';
import { logger } from '@/shared/lib';
import { setKeepAwake } from '../api/keepAwake';

export const useKeepAwakeTimerSync = () => {
  useEffect(() => {
    let lastKeepPCAwake = false;
    let lastKeepDisplayAwake = false;

    const syncKeepAwakeState = () => {
      const { timerState } = useTimerStore.getState();
      const { timerAction } = useSessionStore.getState();
      const { isPreventPCSleepDuringTimerEnabled, isPreventDisplaySleepDuringTimerEnabled } =
        useSettingsStore.getState();

      const isTimerAwakeActive =
        timerState === 'running' &&
        (timerAction === 'keep-awake' || isPreventPCSleepDuringTimerEnabled);

      const shouldKeepPCAwake = isTimerAwakeActive;
      const shouldKeepDisplayAwake = shouldKeepPCAwake && isPreventDisplaySleepDuringTimerEnabled;

      if (
        shouldKeepPCAwake === lastKeepPCAwake &&
        shouldKeepDisplayAwake === lastKeepDisplayAwake
      ) {
        return;
      }

      lastKeepPCAwake = shouldKeepPCAwake;
      lastKeepDisplayAwake = shouldKeepDisplayAwake;

      setKeepAwake({
        isEnabled: shouldKeepPCAwake,
        keepDisplayAwake: shouldKeepDisplayAwake,
      }).catch(err => {
        logger.error(`Failed to sync keep-awake state: ${err}`);
      });
    };

    // Run initial check
    syncKeepAwakeState();

    const unsubscribeTimer = useTimerStore.subscribe(syncKeepAwakeState);
    const unsubscribeSession = useSessionStore.subscribe(syncKeepAwakeState);
    const unsubscribeSettings = useSettingsStore.subscribe(syncKeepAwakeState);

    return () => {
      unsubscribeTimer();
      unsubscribeSession();
      unsubscribeSettings();

      if (lastKeepPCAwake) {
        setKeepAwake({ isEnabled: false, keepDisplayAwake: false }).catch(err => {
          logger.error(`Failed to release keep-awake on unmount: ${err}`);
        });
      }
    };
  }, []);
};
