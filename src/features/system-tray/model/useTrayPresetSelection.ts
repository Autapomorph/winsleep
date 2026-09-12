import { useEffect } from 'react';

import { useKeepAwakeStore } from '@/entities/keep-awake';
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
      const { timerState, cancel, start, setExactTime, onCompleteCallback } =
        useTimerStore.getState();
      const { isIndefiniteActive, startIndefinite, stopIndefinite } = useKeepAwakeStore.getState();

      if (timerAction === 'keep-awake') {
        if (seconds === 0) {
          if (timerState === 'running') {
            cancel();
            setExactTime(0);
            startIndefinite();
            return;
          }

          if (timerState === 'paused') {
            cancel();
            setExactTime(0);
            return;
          }

          if (isIndefiniteActive) {
            return;
          }

          setExactTime(0);
          return;
        }

        if (isIndefiniteActive) {
          stopIndefinite();
          setExactTime(seconds);

          if (onCompleteCallback) {
            start(onCompleteCallback);
          }

          return;
        }
      }

      if (isIndefiniteActive) {
        stopIndefinite();
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
