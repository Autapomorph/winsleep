import { useEffect } from 'react';

import { typedEmit } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useAppReady = () => {
  useEffect(() => {
    typedEmit('app-ready');
    logger.info('App initialized');
  }, []);
};
