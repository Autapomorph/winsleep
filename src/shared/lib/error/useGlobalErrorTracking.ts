import { useEffect } from 'react';

import { initGlobalErrorTracking } from './globalErrorTracking';
import { showErrorToast } from '../toast/errorToast';

export const useGlobalErrorTracking = () => {
  useEffect(() => {
    const cleanupErrorTracking = initGlobalErrorTracking(showErrorToast);

    return () => {
      cleanupErrorTracking();
    };
  }, []);
};
