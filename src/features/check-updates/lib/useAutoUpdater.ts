import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStateStore } from '@/entities/app-state';
import { useSettingsStore } from '@/entities/setting';
import { useUpdateStore } from '@/entities/updater';
import { typedListen } from '@/shared/api';
import { getDateNow, logger, noop } from '@/shared/lib';

const STARTUP_DELAY_MS = 3000;
const RETRY_DELAY_ON_ERROR_MS = 15 * 60 * 1000;

export const useAutoUpdater = () => {
  const { isAutoUpdateEnabled, updateInterval } = useSettingsStore(
    useShallow(state => ({
      isAutoUpdateEnabled: state.isAutoUpdateEnabled,
      updateInterval: state.updateInterval,
    })),
  );

  const lastUpdateCheckAt = useAppStateStore(state => state.lastUpdateCheckAt);
  const checkUpdates = useUpdateStore(state => state.checkUpdates);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync successful update checks to state.json
  useEffect(() => {
    let prevStatus = useUpdateStore.getState().status;

    const unsubscribe = useUpdateStore.subscribe(state => {
      const currentStatus = state.status;

      if (
        prevStatus === 'checking' &&
        (currentStatus === 'available' || currentStatus === 'upToDate')
      ) {
        useAppStateStore.getState().setLastUpdateCheckAt(getDateNow());
      }

      prevStatus = currentStatus;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Main scheduler effect
  useEffect(() => {
    if (!isAutoUpdateEnabled) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      return noop;
    }

    if (updateInterval === 'startup') {
      timerRef.current = setTimeout(() => {
        checkUpdates().catch(() => {});
      }, STARTUP_DELAY_MS);

      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    const intervalMs = updateInterval * 60 * 60 * 1000;

    const scheduleCheck = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const currentLastCheck = useAppStateStore.getState().lastUpdateCheckAt;
      const now = getDateNow();
      const elapsed = currentLastCheck !== null ? now - currentLastCheck : Number.POSITIVE_INFINITY;
      const isDue = currentLastCheck === null || elapsed < 0 || elapsed >= intervalMs;

      const delayMs = isDue ? STARTUP_DELAY_MS : Math.max(STARTUP_DELAY_MS, intervalMs - elapsed);

      timerRef.current = setTimeout(() => {
        checkUpdates()
          .then(() => {
            const { status } = useUpdateStore.getState();

            if (status === 'error') {
              const retryDelayMs = Math.min(intervalMs, RETRY_DELAY_ON_ERROR_MS);

              timerRef.current = setTimeout(() => {
                scheduleCheck();
              }, retryDelayMs);
            }
          })
          .catch(() => {});
      }, delayMs);
    };

    scheduleCheck();

    const unlistenSystemResume = typedListen('system-resume', () => {
      scheduleCheck();
    });

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      unlistenSystemResume
        .then(unlisten => {
          unlisten();
        })
        .catch(err => {
          logger.error(`Failed to unsubscribe from system-resume event: ${err}`);
        });
    };
  }, [isAutoUpdateEnabled, updateInterval, lastUpdateCheckAt, checkUpdates]);
};
