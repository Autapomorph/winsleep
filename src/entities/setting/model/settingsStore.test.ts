import {
  disable as disableAutostart,
  enable as enableAutostart,
} from '@tauri-apps/plugin-autostart';

import { typedInvoke } from '@/shared/api';
import { useSettingsStore } from './settingsStore';

vi.mock(import('@tauri-apps/plugin-autostart'), () => ({
  enable: vi.fn().mockResolvedValue(undefined),
  disable: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(import('@/shared/api'), () => ({
  typedInvoke: vi.fn().mockResolvedValue(undefined),
}));

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  test('handles TimerActionSlice actions', () => {
    const store = useSettingsStore.getState();

    store.setDefaultTimerAction('hibernate');
    expect(useSettingsStore.getState().defaultTimerAction).toBe('hibernate');

    store.setShouldRememberSelectedTimerAction(true);
    expect(useSettingsStore.getState().shouldRememberSelectedTimerAction).toBe(true);
  });

  test('handles TimerSlice actions', () => {
    const store = useSettingsStore.getState();

    store.setDefaultTimerSeconds(600);
    expect(useSettingsStore.getState().defaultTimerSeconds).toBe(600);

    store.setShouldRememberConfiguredTime(true);
    expect(useSettingsStore.getState().shouldRememberConfiguredTime).toBe(true);

    store.setIsLockedByDefault(true);
    expect(useSettingsStore.getState().isLockedByDefault).toBe(true);

    store.setIsCustomTimerStepsEnabled(true);
    expect(useSettingsStore.getState().isCustomTimerStepsEnabled).toBe(true);

    store.setTimerStepIncrease(15);
    expect(useSettingsStore.getState().timerStepIncrease).toBe(15);

    store.setTimerStepDecrease(25);
    expect(useSettingsStore.getState().timerStepDecrease).toBe(25);
  });

  test('handles custom timer presets: add, remove, update', () => {
    const store = useSettingsStore.getState();
    const initialPresetCount = store.customTimerPresets.length;

    // Add preset
    store.addCustomTimerPreset(900);

    let currentPresets = useSettingsStore.getState().customTimerPresets;
    const addedPreset = currentPresets[currentPresets.length - 1];

    expect(currentPresets.length).toBe(initialPresetCount + 1);
    expect(addedPreset.seconds).toBe(900);
    expect(addedPreset.id).toBeDefined();

    // Update preset
    store.updateCustomTimerPreset(addedPreset.id, { seconds: 1200 });
    currentPresets = useSettingsStore.getState().customTimerPresets;
    expect(currentPresets.find(p => p.id === addedPreset.id)?.seconds).toBe(1200);

    // Remove preset
    store.removeCustomTimerPreset(addedPreset.id);
    currentPresets = useSettingsStore.getState().customTimerPresets;
    expect(currentPresets.length).toBe(initialPresetCount);
    expect(currentPresets.find(p => p.id === addedPreset.id)).toBeUndefined();
  });

  test('handles NotificationSlice actions: notifications toggle, times list, sound settings', () => {
    const store = useSettingsStore.getState();

    store.setIsNotificationsEnabled(false);
    expect(useSettingsStore.getState().isNotificationsEnabled).toBe(false);

    // Clear notification times to verify additions
    store.setNotificationTimes([]);
    expect(useSettingsStore.getState().notificationTimes).toEqual([]);

    // Add notification times (should be sorted ascending)
    store.addNotificationTime(30);
    store.addNotificationTime(10);
    store.addNotificationTime(20);
    // Duplicate addition should be ignored
    store.addNotificationTime(10);

    let times = useSettingsStore.getState().notificationTimes;
    expect(times.map(t => t.seconds)).toEqual([10, 20, 30]);

    // Update notification time
    const secondId = times[1].id;
    store.updateNotificationTime(secondId, 15);
    times = useSettingsStore.getState().notificationTimes;
    expect(times.map(t => t.seconds)).toEqual([10, 15, 30]);

    // Update duplicate time should be ignored
    store.updateNotificationTime(secondId, 30);
    times = useSettingsStore.getState().notificationTimes;
    expect(times.map(t => t.seconds)).toEqual([10, 15, 30]);

    // Remove notification time
    store.removeNotificationTime(secondId);
    times = useSettingsStore.getState().notificationTimes;
    expect(times.map(t => t.seconds)).toEqual([10, 30]);

    // Sound settings
    store.setIsNotificationSoundEnabled(true);
    expect(useSettingsStore.getState().isNotificationSoundEnabled).toBe(true);

    store.setNotificationSoundType('app');
    expect(useSettingsStore.getState().notificationSoundType).toBe('app');
  });

  test('handles SystemSlice actions: tray mode, autostart, minimized state, auto updates', async () => {
    const store = useSettingsStore.getState();

    // Tray mode toggle
    store.setIsTrayModeEnabled(true);
    expect(useSettingsStore.getState().isTrayModeEnabled).toBe(true);
    expect(useSettingsStore.getState().hasSeenTrayNotification).toBe(false);
    expect(typedInvoke).toHaveBeenCalledWith('set_is_tray_mode_enabled', { isEnabled: true });

    // Autostart enable
    store.setIsAutostartEnabled(true);
    expect(useSettingsStore.getState().isAutostartEnabled).toBe(true);
    expect(enableAutostart).toHaveBeenCalled();

    // Autostart disable
    store.setIsAutostartEnabled(false);
    expect(useSettingsStore.getState().isAutostartEnabled).toBe(false);
    expect(disableAutostart).toHaveBeenCalled();

    // Start minimized
    store.setIsStartMinimizedEnabled(true);
    expect(useSettingsStore.getState().isStartMinimizedEnabled).toBe(true);

    // Auto update
    store.setIsAutoUpdateEnabled(true);
    expect(useSettingsStore.getState().isAutoUpdateEnabled).toBe(true);

    // Update interval
    store.setUpdateInterval(6);
    expect(useSettingsStore.getState().updateInterval).toBe(6);

    // Has seen tray notification toggle
    store.setHasSeenTrayNotification(true);
    expect(useSettingsStore.getState().hasSeenTrayNotification).toBe(true);
  });

  test('handles error catching in autostart toggling', async () => {
    vi.mocked(enableAutostart).mockRejectedValueOnce(new Error('Autostart failed'));
    const store = useSettingsStore.getState();

    // Should catch the error internally without crashing
    expect(() => {
      store.setIsAutostartEnabled(true);
    }).not.toThrow();
  });

  test('handles resetToDefaults and keeps hasSeenTrayNotification', () => {
    const store = useSettingsStore.getState();

    // Mutate states
    store.setHasSeenTrayNotification(true);
    store.setDefaultTimerSeconds(1000);

    // Reset
    store.resetToDefaults();

    const state = useSettingsStore.getState();
    expect(state.defaultTimerSeconds).toBe(120); // Back to default
    expect(state.hasSeenTrayNotification).toBe(true); // Persists
  });
});
