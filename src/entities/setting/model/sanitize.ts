import {
  type NotificationSound,
  type TimerAction,
  DEFAULT_CUSTOM_TIMER_PRESETS,
  DEFAULT_HAS_SEEN_TRAY_NOTIFICATION,
  DEFAULT_IS_AUTO_UPDATE_ENABLED,
  DEFAULT_IS_AUTOSTART_ENABLED,
  DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED,
  DEFAULT_IS_LOCKED_BY_DEFAULT,
  DEFAULT_IS_NOTIFICATION_SOUND_ENABLED,
  DEFAULT_IS_NOTIFICATIONS_ENABLED,
  DEFAULT_IS_START_MINIMIZED_ENABLED,
  DEFAULT_IS_TRAY_MODE_ENABLED,
  DEFAULT_NOTIFICATION_SECONDS,
  DEFAULT_NOTIFICATION_SOUND_TYPE,
  DEFAULT_NOTIFICATION_TIMES,
  DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME,
  DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
  DEFAULT_TIMER_ACTION,
  DEFAULT_TIMER_SECONDS,
  DEFAULT_TIMER_STEP_SECONDS,
  DEFAULT_UPDATE_INTERVAL,
} from '@/shared/config';
import { isValidTimerAction, isValidUpdateInterval } from '@/shared/lib';
import { CURRENT_SETTINGS_VERSION } from './migrate';
import { type SerializedSettings } from './serialize';

export const sanitizeSettings = (rawSettings: Record<string, unknown>): SerializedSettings => {
  // Sanitize version
  const version =
    typeof rawSettings.version === 'number' ? rawSettings.version : CURRENT_SETTINGS_VERSION;

  // Sanitize defaultTimerAction
  const defaultTimerAction: TimerAction = isValidTimerAction(rawSettings.defaultTimerAction)
    ? rawSettings.defaultTimerAction
    : DEFAULT_TIMER_ACTION;

  // Sanitize shouldRememberSelectedTimerAction
  const shouldRememberSelectedTimerAction =
    typeof rawSettings.shouldRememberSelectedTimerAction === 'boolean'
      ? rawSettings.shouldRememberSelectedTimerAction
      : DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION;

  // Sanitize defaultTimerSeconds
  const defaultTimerSeconds =
    typeof rawSettings.defaultTimerSeconds === 'number' && rawSettings.defaultTimerSeconds >= 0
      ? rawSettings.defaultTimerSeconds
      : DEFAULT_TIMER_SECONDS;

  // Sanitize shouldRememberConfiguredTime
  const shouldRememberConfiguredTime =
    typeof rawSettings.shouldRememberConfiguredTime === 'boolean'
      ? rawSettings.shouldRememberConfiguredTime
      : DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME;

  // Sanitize isCustomTimerStepsEnabled
  const isCustomTimerStepsEnabled =
    typeof rawSettings.isCustomTimerStepsEnabled === 'boolean'
      ? rawSettings.isCustomTimerStepsEnabled
      : DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED;

  // Sanitize timerStepIncrease
  const timerStepIncrease =
    typeof rawSettings.timerStepIncrease === 'number' && rawSettings.timerStepIncrease >= 0
      ? rawSettings.timerStepIncrease
      : DEFAULT_TIMER_STEP_SECONDS;

  // Sanitize timerStepDecrease
  const timerStepDecrease =
    typeof rawSettings.timerStepDecrease === 'number' && rawSettings.timerStepDecrease >= 0
      ? rawSettings.timerStepDecrease
      : DEFAULT_TIMER_STEP_SECONDS;

  // Sanitize isLockedByDefault
  const isLockedByDefault =
    typeof rawSettings.isLockedByDefault === 'boolean'
      ? rawSettings.isLockedByDefault
      : DEFAULT_IS_LOCKED_BY_DEFAULT;

  // Sanitize isNotificationsEnabled
  const isNotificationsEnabled =
    typeof rawSettings.isNotificationsEnabled === 'boolean'
      ? rawSettings.isNotificationsEnabled
      : DEFAULT_IS_NOTIFICATIONS_ENABLED;

  // Sanitize isNotificationSoundEnabled
  const isNotificationSoundEnabled =
    typeof rawSettings.isNotificationSoundEnabled === 'boolean'
      ? rawSettings.isNotificationSoundEnabled
      : DEFAULT_IS_NOTIFICATION_SOUND_ENABLED;

  // Sanitize notificationSoundType
  const notificationSoundType: NotificationSound =
    rawSettings.notificationSoundType === 'system' || rawSettings.notificationSoundType === 'app'
      ? rawSettings.notificationSoundType
      : DEFAULT_NOTIFICATION_SOUND_TYPE;

  // Sanitize isTrayModeEnabled
  const isTrayModeEnabled =
    typeof rawSettings.isTrayModeEnabled === 'boolean'
      ? rawSettings.isTrayModeEnabled
      : DEFAULT_IS_TRAY_MODE_ENABLED;

  // Sanitize isAutostartEnabled
  const isAutostartEnabled =
    typeof rawSettings.isAutostartEnabled === 'boolean'
      ? rawSettings.isAutostartEnabled
      : DEFAULT_IS_AUTOSTART_ENABLED;

  // Sanitize isStartMinimizedEnabled
  const isStartMinimizedEnabled =
    typeof rawSettings.isStartMinimizedEnabled === 'boolean'
      ? rawSettings.isStartMinimizedEnabled
      : DEFAULT_IS_START_MINIMIZED_ENABLED;

  // Sanitize isAutoUpdateEnabled
  const isAutoUpdateEnabled =
    typeof rawSettings.isAutoUpdateEnabled === 'boolean'
      ? rawSettings.isAutoUpdateEnabled
      : DEFAULT_IS_AUTO_UPDATE_ENABLED;

  // Sanitize updateInterval
  const updateInterval = isValidUpdateInterval(rawSettings.updateInterval)
    ? rawSettings.updateInterval
    : DEFAULT_UPDATE_INTERVAL;

  // Sanitize hasSeenTrayNotification
  const hasSeenTrayNotification =
    typeof rawSettings.hasSeenTrayNotification === 'boolean'
      ? rawSettings.hasSeenTrayNotification
      : DEFAULT_HAS_SEEN_TRAY_NOTIFICATION;

  // Sanitize notificationTimes
  const rawNotificationTimes = Array.isArray(rawSettings.notificationTimes)
    ? rawSettings.notificationTimes
    : DEFAULT_NOTIFICATION_TIMES;

  const notificationTimes = rawNotificationTimes.map((seconds: unknown) => {
    const num = typeof seconds === 'number' ? seconds : Number(seconds);
    return Number.isNaN(num) || num <= 0 ? DEFAULT_NOTIFICATION_SECONDS : num;
  });

  // Sanitize customTimerPresets
  const rawCustomPresets = Array.isArray(rawSettings.customTimerPresets)
    ? rawSettings.customTimerPresets
    : DEFAULT_CUSTOM_TIMER_PRESETS;

  const customTimerPresets = rawCustomPresets.map((preset: unknown) => {
    if (preset && typeof preset === 'object' && 'seconds' in preset) {
      const sec = typeof preset.seconds === 'number' ? preset.seconds : Number(preset.seconds);
      return Number.isNaN(sec) || sec < 0 ? 0 : sec;
    }

    const num = typeof preset === 'number' ? preset : Number(preset);
    return Number.isNaN(num) || num < 0 ? 0 : num;
  });

  return {
    version,
    defaultTimerAction,
    shouldRememberSelectedTimerAction,
    defaultTimerSeconds,
    shouldRememberConfiguredTime,
    isLockedByDefault,
    isCustomTimerStepsEnabled,
    timerStepIncrease,
    timerStepDecrease,
    customTimerPresets,
    isNotificationsEnabled,
    notificationTimes,
    isNotificationSoundEnabled,
    notificationSoundType,
    isTrayModeEnabled,
    isAutostartEnabled,
    isStartMinimizedEnabled,
    isAutoUpdateEnabled,
    updateInterval,
    hasSeenTrayNotification,
  };
};
