import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useSettingsStore } from '@/entities/setting';
import { useUpdateStore } from '@/entities/updater';

export const useAutoUpdater = () => {
  const { isAutoUpdateEnabled, updateInterval } = useSettingsStore(
    useShallow(state => ({
      isAutoUpdateEnabled: state.isAutoUpdateEnabled,
      updateInterval: state.updateInterval,
    })),
  );

  const checkUpdates = useUpdateStore(state => state.checkUpdates);

  useEffect(() => {
    let delayTimeoutId: number | undefined;
    let intervalId: number | undefined;

    if (isAutoUpdateEnabled) {
      // Delay check slightly to prevent resource contention during startup animation
      delayTimeoutId = setTimeout(() => {
        checkUpdates().catch(() => {});
      }, 3000);

      if (typeof updateInterval === 'number') {
        const intervalMs = updateInterval * 60 * 60 * 1000;

        intervalId = setInterval(() => {
          checkUpdates().catch(() => {});
        }, intervalMs);
      }
    }

    return () => {
      clearTimeout(delayTimeoutId);
      clearInterval(intervalId);
    };
  }, [isAutoUpdateEnabled, updateInterval, checkUpdates]);
};
