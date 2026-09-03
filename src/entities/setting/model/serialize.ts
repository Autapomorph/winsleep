import { type NotificationSound, type TimerAction, type UpdateInterval } from '@/shared/config';
import { CURRENT_SETTINGS_VERSION } from './migrate';
import { serializeNotificationTimes } from './notificationTime';
import { type useSettingsStore } from './settingsStore';
import { serializeCustomTimerPresets } from './timerPreset';

export interface SerializedSettings {
  [key: string]: unknown;
  version: number;
  defaultTimerAction: TimerAction;
  shouldRememberSelectedTimerAction: boolean;
  defaultTimerSeconds: number;
  shouldRememberConfiguredTime: boolean;
  isLockedByDefault: boolean;
  isRestoreScheduledTimerOnStartupEnabled: boolean;
  isCustomTimerStepsEnabled: boolean;
  timerStepIncrease: number;
  timerStepDecrease: number;
  customTimerPresets: number[];
  isNotificationsEnabled: boolean;
  notificationTimes: number[];
  isNotificationSoundEnabled: boolean;
  notificationSoundType: NotificationSound;
  isTrayModeEnabled: boolean;
  isAutostartEnabled: boolean;
  isStartMinimizedEnabled: boolean;
  isAutoUpdateEnabled: boolean;
  updateInterval: UpdateInterval;
  hasSeenTrayNotification: boolean;
}

export const serializeSettings = (
  state: ReturnType<typeof useSettingsStore.getState>,
): SerializedSettings => {
  return {
    version: CURRENT_SETTINGS_VERSION,
    defaultTimerAction: state.defaultTimerAction,
    shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
    defaultTimerSeconds: state.defaultTimerSeconds,
    shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
    isLockedByDefault: state.isLockedByDefault,
    isRestoreScheduledTimerOnStartupEnabled: state.isRestoreScheduledTimerOnStartupEnabled,
    isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
    timerStepIncrease: state.timerStepIncrease,
    timerStepDecrease: state.timerStepDecrease,
    customTimerPresets: serializeCustomTimerPresets(state.customTimerPresets),
    isNotificationsEnabled: state.isNotificationsEnabled,
    notificationTimes: serializeNotificationTimes(state.notificationTimes),
    isNotificationSoundEnabled: state.isNotificationSoundEnabled,
    notificationSoundType: state.notificationSoundType,
    isTrayModeEnabled: state.isTrayModeEnabled,
    isAutostartEnabled: state.isAutostartEnabled,
    isStartMinimizedEnabled: state.isStartMinimizedEnabled,
    isAutoUpdateEnabled: state.isAutoUpdateEnabled,
    updateInterval: state.updateInterval,
    hasSeenTrayNotification: state.hasSeenTrayNotification,
  };
};
