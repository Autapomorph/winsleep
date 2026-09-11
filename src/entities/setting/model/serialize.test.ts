import { serializeSettings } from './serialize';
import { type SettingsState, type useSettingsStore } from './settings.store';

describe('serializeSettings', () => {
  test('correctly serializes settings state into a JSON object', () => {
    const mockState: SettingsState = {
      defaultTimerAction: 'sleep',
      shouldRememberSelectedTimerAction: false,
      isForceActionEnabled: true,
      defaultTimerSeconds: 120,
      shouldRememberConfiguredTime: false,
      isLockedByDefault: false,
      isRestoreScheduledTimerOnStartupEnabled: true,
      isPreventPCSleepDuringTimerEnabled: true,
      isPreventDisplaySleepDuringTimerEnabled: false,
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
    expect(serialized.isForceActionEnabled).toBe(true);
    expect(serialized.isPreventPCSleepDuringTimerEnabled).toBe(true);
    expect(serialized.isPreventDisplaySleepDuringTimerEnabled).toBe(false);
    expect(serialized.defaultTimerSeconds).toBe(120);
    expect(serialized.customTimerPresets).toEqual([60]);
    expect(serialized.notificationTimes).toEqual([60]);
  });
});
