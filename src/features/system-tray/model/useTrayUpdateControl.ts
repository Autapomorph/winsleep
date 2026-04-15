import { useEffect, useRef } from 'react';

import { useUpdater } from '@/entities/updater';
import { typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayUpdateControl = () => {
  const update = useUpdater();
  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    let isActive = true;

    const unlistenPromise = typedListen('tray-update-clicked', () => {
      if (isActive) {
        logger.info('Update clicked from tray menu');
        updateRef.current().catch(() => {});
      }
    });

    return () => {
      isActive = false;
      unlistenPromise
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray update control events: ${err}`);
        });
    };
  }, []);
};
