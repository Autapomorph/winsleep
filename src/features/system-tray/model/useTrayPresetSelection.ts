import { useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayPresetSelection = () => {
  useEffect(() => {
    let isActive = true;

    const unlistenPresetSelected = typedListen('tray-preset-selected', event => {
      if (!isActive) {
        return;
      }

      const seconds = event.payload;
      logger.info(`Preset clicked from tray menu: ${seconds}s`);

      const { timerAction } = useSessionStore.getState();
      const { setExactTime, setIndefinite } = useTimerStore.getState();

      if (timerAction === 'keep-awake' && seconds === 0) {
        setIndefinite();
        return;
      }

      setExactTime(seconds);
    });

    return () => {
      isActive = false;
      unlistenPresetSelected
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray preset selected event: ${err}`);
        });
    };
  }, []);
};
