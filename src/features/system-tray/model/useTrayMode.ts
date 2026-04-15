import { useClosedToTrayNotification } from './useClosedToTrayNotification';
import { useTrayActionSelection } from './useTrayActionSelection';
import { useTrayLanguageSync } from './useTrayLanguageSync';
import { useTrayStateSync } from './useTrayStateSync';
import { useTrayTimerControl } from './useTrayTimerControl';
import { useTrayUpdateControl } from './useTrayUpdateControl';

export const useTrayMode = () => {
  useTrayStateSync();
  useTrayLanguageSync();
  useClosedToTrayNotification();
  useTrayActionSelection();
  useTrayTimerControl();
  useTrayUpdateControl();
};
