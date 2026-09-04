import { serializeSettings } from './serialize';
import { type SettingsState, type useSettingsStore } from './settings.store';

describe('serializeSettings', () => {
  test('correctly serializes settings state into a JSON object', () => {
    const mockState: SettingsState = {
      defaultTimerAction: 'sleep',
      shouldRememberSelectedTimerAction: false,
      defaultTimerSeconds: 120,
      shouldRememberConfiguredTime: false,
      isLockedByDefault: false,
      isRestoreScheduledTimerOnStartupEnabled: true,
      isCustomTimerStepsEnabled: false,
      timerStepIncrease: 30,
      timerStepDecrease: 30,
      customTimerPresets: [{ id: '1', seconds: 60 }],
      isNotificationsEnabled: true,
      notificationTimes: [{ id: '2', seconds: 60 }],
      isNotificationSoundEnabled: true,
      notificationSoundType: 'system',
      isTrayModeEnabled: true,
      isAutostartEnabled: false,
      isStartMinimizedEnabled: false,
      isAutoUpdateEnabled: true,
      updateInterval: 6,
      hasSeenTrayNotification: false,
    };

    const serialized = serializeSettings(
      mockState as unknown as ReturnType<typeof useSettingsStore.getState>,
    );

    expect(serialized.version).toBeDefined();
    expect(serialized.defaultTimerSeconds).toBe(120);
    expect(serialized.customTimerPresets).toEqual([60]);
    expect(serialized.notificationTimes).toEqual([60]);
  });
});
