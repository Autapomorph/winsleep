import { useEffect } from 'react';

import { useTimerStore } from '@/entities/timer';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';
import { useTimerExecution } from './useTimerExecution';

export const useTimerCompletionListener = () => {
  const { execute } = useTimerExecution();

  useEffect(() => {
    let isActive = true;

    const unlistenPromise = typedListen('timer-complete', async () => {
      if (!isActive) {
        return;
      }

      const { timerState, cancel } = useTimerStore.getState();

      if (timerState === 'running') {
        logger.info('Timer completed naturally via backend signal');
        cancel();
        await execute();
      }
    });

    return () => {
      isActive = false;
      unlistenPromise
        .then(unlisten => {
          unlisten();
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from timer-complete: ${err}`);
        });
    };
  }, [execute]);
};
