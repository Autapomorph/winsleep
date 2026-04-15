import { deserializeNotificationTimes } from './notificationTime';
import { sanitizeSettings } from './sanitize';
import { type SettingsState } from './settingsStore';
import { deserializeCustomTimerPresets } from './timerPreset';

export const deserializeSettings = (rawSettings: Record<string, unknown>): SettingsState => {
  const cleanSettings = sanitizeSettings(rawSettings);

  return {
    ...cleanSettings,
    notificationTimes: deserializeNotificationTimes(cleanSettings.notificationTimes),
    customTimerPresets: deserializeCustomTimerPresets(cleanSettings.customTimerPresets),
  };
};
