import { useEffect } from 'react';

import { useSettingsStore } from '@/entities/setting';
import { typedInvoke } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useTrayStateSync = () => {
  useEffect(() => {
    const { isTrayModeEnabled } = useSettingsStore.getState();

    typedInvoke('set_is_tray_mode_enabled', { isEnabled: isTrayModeEnabled }).catch(err =>
      logger.error(`Failed to sync initial tray mode: ${err}`),
    );
  }, []);
};
