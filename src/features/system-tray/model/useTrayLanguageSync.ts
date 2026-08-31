import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import pRetry, { AbortError } from 'p-retry';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import {
  DANGER_THRESHOLD_SECONDS,
  DEFAULT_TIMER_STEP_SECONDS,
  useTimerStore,
} from '@/entities/timer';
import { useUpdateStore } from '@/entities/updater';
import { type TrayMenuState, typedInvoke, typedListen } from '@/shared/api';
import { DEFAULT_TIMER_PRESETS } from '@/shared/config';
import { formatDays, formatDurationShort, formatTime, logger } from '@/shared/lib';

const WINDOWS_TIMEOUT_ERROR_CODE = '1460';
const WINDOWS_TIMEOUT_ERROR_KEYWORD = 'timeout';

export const useTrayLanguageSync = () => {
  const { t, i18n } = useTranslation();
  const [syncTrigger, setSyncTrigger] = useState(0);

  const { timerAction, isSettingsLocked } = useSessionStore(
    useShallow(state => ({
      timerAction: state.timerAction,
      isSettingsLocked: state.isLocked,
    })),
  );

  const { timerState, timerMode, remainingSeconds, plannedSeconds } = useTimerStore(
    useShallow(state => ({
      timerState: state.timerState,
      timerMode: state.timerMode,
      remainingSeconds: state.remainingSeconds,
      plannedSeconds: state.plannedSeconds,
    })),
  );

  const { updateStatus, downloadProgress } = useUpdateStore(
    useShallow(state => ({
      updateStatus: state.status,
      downloadProgress: state.downloadProgress,
    })),
  );

  const { isCustomTimerStepsEnabled, timerStepIncrease, timerStepDecrease, customTimerPresets } =
    useSettingsStore(
      useShallow(state => ({
        isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
        timerStepIncrease: state.timerStepIncrease,
        timerStepDecrease: state.timerStepDecrease,
        customTimerPresets: state.customTimerPresets,
      })),
    );

  useEffect(() => {
    let isActive = true;

    const unlistenTraySyncRequest = typedListen('tray-sync-request', () => {
      if (isActive) {
        setSyncTrigger(prev => prev + 1);
      }
    });

    return () => {
      isActive = false;
      unlistenTraySyncRequest
        .then(unlisten => unlisten())
        .catch(err => {
          logger.error(`Failed to unsubscribe from tray sync events: ${err}`);
        });
    };
  }, []);

  useEffect(() => {
    let tooltip = t($ => $.tray.tooltip.default);

    if (timerState === 'paused') {
      tooltip = t($ => $.tray.tooltip.paused, {
        remainingTime: formatDays(remainingSeconds, t) ?? formatTime(remainingSeconds),
      });
    } else if (timerState === 'running') {
      tooltip = t($ => $.tray.tooltip.running, {
        remainingTime: formatDays(remainingSeconds, t) ?? formatTime(remainingSeconds),
      });
    }

    const timerActionLabels: Record<typeof timerAction, string> = {
      sleep: t($ => $.tray.menu.timerAction.sleep),
      hibernate: t($ => $.tray.menu.timerAction.hibernate),
      shutdown: t($ => $.tray.menu.timerAction.shutdown),
      reboot: t($ => $.tray.menu.timerAction.reboot),
      lock: t($ => $.tray.menu.timerAction.lock),
      signout: t($ => $.tray.menu.timerAction.signout),
    };

    const selectedTimerActionLabel = timerActionLabels[timerAction];

    let timerStatusLabel = t($ => $.tray.menu.timerState.notRunning, {
      plannedTime: formatDays(plannedSeconds, t) ?? formatTime(plannedSeconds),
    });

    if (timerState === 'running' || timerState === 'paused') {
      timerStatusLabel = `${timerActionLabels[timerAction]}: ${
        formatDays(remainingSeconds, t) ?? formatTime(remainingSeconds)
      }`;
    }

    let startResumePauseTimerLabel = t($ => $.tray.menu.startTimer);

    if (timerState === 'paused') {
      startResumePauseTimerLabel = t($ => $.tray.menu.resumeTimer);
    } else if (timerState === 'running') {
      startResumePauseTimerLabel = t($ => $.tray.menu.pauseTimer);
    }

    const cancelTimerLabel = t($ => $.tray.menu.cancelTimer);

    const increaseStep = isCustomTimerStepsEnabled ? timerStepIncrease : DEFAULT_TIMER_STEP_SECONDS;
    const decreaseStep = isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS;

    const formattedIncreaseStep = formatDurationShort(increaseStep, t);
    const formattedDecreaseStep = formatDurationShort(decreaseStep, t);

    const timerIncreaseLabel = t($ => $.tray.menu.increaseTimer, { amount: formattedIncreaseStep });
    const timerDecreaseLabel = t($ => $.tray.menu.decreaseTimer, { amount: formattedDecreaseStep });

    const getUpdateText = () => {
      switch (updateStatus) {
        case 'checking':
          return t($ => $.tray.menu.checkUpdates.checking);
        case 'available':
          return t($ => $.tray.menu.checkUpdates.available);
        case 'downloading':
          return t($ => $.tray.menu.checkUpdates.downloading, {
            progress: downloadProgress,
          });
        case 'readyToRestart':
          return t($ => $.tray.menu.checkUpdates.readyToRestart);
        default:
          return t($ => $.tray.menu.checkUpdates.default);
      }
    };

    const updateLabel = getUpdateText();

    const isExpiring = timerState !== 'idle' && remainingSeconds <= DANGER_THRESHOLD_SECONDS;

    const customSeconds = customTimerPresets.map(p => p.seconds);
    const allPresetSeconds = Array.from(new Set([...DEFAULT_TIMER_PRESETS, ...customSeconds])).sort(
      (a, b) => a - b,
    );

    const timerPresets = allPresetSeconds.map(time => {
      const label = time === 0 ? t($ => $.timer.nowLabel.text) : formatDurationShort(time, t);
      return { seconds: time, label };
    });

    const presetsLabel = t($ => $.tray.menu.selectPreset);

    const lockSettingsLabel = isSettingsLocked
      ? t($ => $.tray.menu.unlockSettings)
      : t($ => $.tray.menu.lockSettings);

    const payload: TrayMenuState = {
      tooltip,
      openLabel: t($ => $.tray.menu.open),
      quitLabel: t($ => $.tray.menu.quit),
      timerState,
      timerMode,
      isExpiring,
      timerAction: {
        selectedTimerActionLabel,
        selectedTimerAction: timerAction,
        sleepLabel: timerActionLabels.sleep,
        hibernateLabel: timerActionLabels.hibernate,
        shutdownLabel: timerActionLabels.shutdown,
        rebootLabel: timerActionLabels.reboot,
        lockLabel: timerActionLabels.lock,
        signoutLabel: timerActionLabels.signout,
      },
      timerStatusLabel,
      startResumePauseTimerLabel,
      cancelTimerLabel,
      timerIncreaseLabel,
      timerDecreaseLabel,
      presetsLabel,
      isSettingsLocked,
      timerPresets,
      lockSettingsLabel,
      updateLabel,
      updateStatus,
    };

    const controller = new AbortController();

    pRetry(() => typedInvoke('update_tray_menu', payload), {
      retries: 3,
      minTimeout: 1000,
      factor: 2,
      signal: controller.signal,
      onFailedAttempt: context => {
        const errorStr = String(context.error.message);
        const isTimeout =
          errorStr.includes(WINDOWS_TIMEOUT_ERROR_CODE) ||
          errorStr.toLowerCase().includes(WINDOWS_TIMEOUT_ERROR_KEYWORD);

        if (!isTimeout) {
          throw new AbortError(context.error);
        }

        logger.debug(
          `Failed to update tray menu due to timeout (attempt ${context.attemptNumber}/4). Retrying...`,
        );
      },
    }).catch(err => {
      if (controller.signal.aborted) {
        return;
      }

      logger.error(`Failed to update tray menu language: ${err}`);
    });

    return () => {
      controller.abort();
    };
  }, [
    t,
    i18n.language,
    remainingSeconds,
    plannedSeconds,
    timerState,
    timerMode,
    timerAction,
    isSettingsLocked,
    isCustomTimerStepsEnabled,
    timerStepIncrease,
    timerStepDecrease,
    customTimerPresets,
    updateStatus,
    downloadProgress,
    syncTrigger,
  ]);
};
