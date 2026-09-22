import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { DANGER_THRESHOLD_SECONDS, useTimerStore } from '@/entities/timer';
import { useUpdateStore } from '@/entities/updater';
import { type TrayMenuState, typedInvoke, typedListen } from '@/shared/api';
import {
  type TimerAction,
  DEFAULT_TIMER_PRESETS,
  DEFAULT_TIMER_STEP_SECONDS,
} from '@/shared/config';
import { formatDays, formatDurationShort, formatTime, logger } from '@/shared/lib';

export const useTrayLanguageSync = () => {
  const { t } = useTranslation();
  const [syncTrigger, setSyncTrigger] = useState(0);

  const isSettingsLocked = useSessionStore(state => state.isLocked);

  const { timerAction, timerState, timerMode, remainingSeconds, plannedSeconds } = useTimerStore(
    useShallow(state => ({
      timerAction: state.timerAction,
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

  const staticLabels = useMemo(() => {
    const tooltipActionLabels: Record<TimerAction, string> = {
      sleep: t($ => $.tray.tooltip.action.sleep),
      hibernate: t($ => $.tray.tooltip.action.hibernate),
      shutdown: t($ => $.tray.tooltip.action.shutdown),
      reboot: t($ => $.tray.tooltip.action.reboot),
      lock: t($ => $.tray.tooltip.action.lock),
      signout: t($ => $.tray.tooltip.action.signout),
      'keep-awake': t($ => $.tray.tooltip.action.keepAwake),
    };

    const timerActionLabels: Record<TimerAction, string> = {
      sleep: t($ => $.tray.menu.timerAction.sleep),
      hibernate: t($ => $.tray.menu.timerAction.hibernate),
      shutdown: t($ => $.tray.menu.timerAction.shutdown),
      reboot: t($ => $.tray.menu.timerAction.reboot),
      lock: t($ => $.tray.menu.timerAction.lock),
      signout: t($ => $.tray.menu.timerAction.signout),
      'keep-awake': t($ => $.tray.menu.timerAction.keepAwake),
    };

    const increaseStep = isCustomTimerStepsEnabled ? timerStepIncrease : DEFAULT_TIMER_STEP_SECONDS;
    const decreaseStep = isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS;

    const formattedIncreaseStep = formatDurationShort(increaseStep, t);
    const formattedDecreaseStep = formatDurationShort(decreaseStep, t);

    return {
      tooltipActionLabels,
      timerActionLabels,
      openLabel: t($ => $.tray.menu.open),
      quitLabel: t($ => $.tray.menu.quit),
      cancelTimerLabel: t($ => $.tray.menu.cancelTimer),
      presetsLabel: t($ => $.tray.menu.selectPreset),
      lockSettingsLabel: isSettingsLocked
        ? t($ => $.tray.menu.unlockSettings)
        : t($ => $.tray.menu.lockSettings),
      timerIncreaseLabel: t($ => $.tray.menu.increaseTimer, { amount: formattedIncreaseStep }),
      timerDecreaseLabel: t($ => $.tray.menu.decreaseTimer, { amount: formattedDecreaseStep }),
    };
  }, [t, isSettingsLocked, isCustomTimerStepsEnabled, timerStepIncrease, timerStepDecrease]);

  const timerPresets = useMemo(() => {
    const customSeconds = customTimerPresets.map(p => p.seconds);
    const allPresetSeconds = Array.from(new Set([...DEFAULT_TIMER_PRESETS, ...customSeconds])).sort(
      (a, b) => a - b,
    );

    return allPresetSeconds.map(time => {
      let label = formatDurationShort(time, t);
      if (time === 0) {
        label =
          timerAction === 'keep-awake'
            ? t($ => $.timer.indefiniteLabel.text)
            : t($ => $.timer.nowLabel.text);
      }
      return { seconds: time, label };
    });
  }, [customTimerPresets, timerAction, t]);

  useEffect(() => {
    const currentTooltipAction = staticLabels.tooltipActionLabels[timerAction];
    const isIndefinite = timerMode === 'indefinite';

    const formattedRemainingTime = isIndefinite
      ? t($ => $.tray.tooltip.remainingTime.indefinite)
      : (formatDays(remainingSeconds, t) ?? formatTime(remainingSeconds));

    let tooltip = t($ => $.tray.tooltip.default);

    if (timerState === 'running') {
      tooltip = t($ => $.tray.tooltip.running, {
        action: currentTooltipAction,
        remainingTime: formattedRemainingTime,
      });
    } else if (timerState === 'paused') {
      tooltip = t($ => $.tray.tooltip.paused, {
        action: currentTooltipAction,
        remainingTime: formattedRemainingTime,
      });
    }

    const selectedTimerActionLabel = staticLabels.timerActionLabels[timerAction];

    let timerStatusLabel = t($ => $.tray.menu.timerState.notRunning, {
      plannedTime: formatDays(plannedSeconds, t) ?? formatTime(plannedSeconds),
    });

    if (isIndefinite) {
      timerStatusLabel =
        timerState === 'running'
          ? t($ => $.timer.triggerAt.keepAwakeIndefiniteRunning)
          : t($ => $.timer.triggerAt.keepAwakeIndefiniteIdle);
    } else if (timerState === 'running' || timerState === 'paused') {
      timerStatusLabel = `${staticLabels.timerActionLabels[timerAction]}: ${
        formatDays(remainingSeconds, t) ?? formatTime(remainingSeconds)
      }`;
    }

    let startResumePauseTimerLabel = t($ => $.tray.menu.startTimer);

    if (timerState === 'paused') {
      startResumePauseTimerLabel = t($ => $.tray.menu.resumeTimer);
    } else if (timerState === 'running') {
      startResumePauseTimerLabel = t($ => $.tray.menu.pauseTimer);
    }

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
        case 'readyToInstall':
          return t($ => $.tray.menu.checkUpdates.readyToInstall);
        default:
          return t($ => $.tray.menu.checkUpdates.default);
      }
    };

    const updateLabel = getUpdateText();

    const isExpiring =
      !isIndefinite && timerState !== 'idle' && remainingSeconds <= DANGER_THRESHOLD_SECONDS;

    const payload: TrayMenuState = {
      tooltip,
      openLabel: staticLabels.openLabel,
      quitLabel: staticLabels.quitLabel,
      timerState,
      timerMode,
      isExpiring,
      timerAction: {
        selectedTimerActionLabel,
        selectedTimerAction: timerAction,
        sleepLabel: staticLabels.timerActionLabels.sleep,
        hibernateLabel: staticLabels.timerActionLabels.hibernate,
        shutdownLabel: staticLabels.timerActionLabels.shutdown,
        rebootLabel: staticLabels.timerActionLabels.reboot,
        lockLabel: staticLabels.timerActionLabels.lock,
        signoutLabel: staticLabels.timerActionLabels.signout,
        keepAwakeLabel: staticLabels.timerActionLabels['keep-awake'],
      },
      timerStatusLabel,
      startResumePauseTimerLabel,
      cancelTimerLabel: staticLabels.cancelTimerLabel,
      timerIncreaseLabel: staticLabels.timerIncreaseLabel,
      timerDecreaseLabel: staticLabels.timerDecreaseLabel,
      presetsLabel: staticLabels.presetsLabel,
      isSettingsLocked,
      timerPresets,
      lockSettingsLabel: staticLabels.lockSettingsLabel,
      updateLabel,
      updateStatus,
    };

    typedInvoke('update_tray_menu', { payload }).catch(err => {
      logger.error(`Failed to update tray menu: ${err}`);
    });
  }, [
    t,
    timerAction,
    remainingSeconds,
    plannedSeconds,
    timerState,
    timerMode,
    isSettingsLocked,
    updateStatus,
    downloadProgress,
    syncTrigger,
    staticLabels,
    timerPresets,
  ]);
};
