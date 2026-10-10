import { useEffect } from 'react';

import { useSettingsStore } from '@/entities/setting';
import { setWebviewZoom } from '@/shared/api';
import { logger } from '@/shared/lib';

export const useZoomSync = () => {
  const zoomFactor = useSettingsStore(state => state.zoomFactor);

  useEffect(() => {
    setWebviewZoom(zoomFactor).catch(err => {
      logger.error(`Failed to apply webview zoom (${zoomFactor}): ${err}`);
    });
  }, [zoomFactor]);
};
