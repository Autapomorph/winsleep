import { useEffect } from 'react';

import { initTimerListeners } from './initTimerListeners';

export const useTimerListeners = () => {
  useEffect(() => {
    initTimerListeners();
  }, []);
};
