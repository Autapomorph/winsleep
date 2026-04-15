import { typedInvoke } from '@/shared/api';
import { logger } from '@/shared/lib';
import { deserializeSettings } from './deserialize';
import { CURRENT_SETTINGS_VERSION, migrateSettings } from './migrate';
import { useSettingsStore } from './settingsStore';

export const loadAndApplySettings = async (
  onLoadingChange: (isLoading: boolean) => void,
  saveSettings: (state: ReturnType<typeof useSettingsStore.getState>) => void,
) => {
  onLoadingChange(true);

  try {
    const data = await typedInvoke('load_settings');

    if (!data) {
      // File does not exist, save current (default) settings immediately
      saveSettings(useSettingsStore.getState());
      return;
    }

    const { settings: rawSettings } = migrateSettings(data);
    const settings = deserializeSettings(rawSettings);

    useSettingsStore.setState(settings);

    // Sync tray mode with the backend
    const isTrayEnabled = settings.isTrayModeEnabled;
    typedInvoke('set_is_tray_mode_enabled', { isEnabled: isTrayEnabled }).catch(err => {
      logger.error(`Failed to sync tray mode: ${err}`);
    });

    // If the loaded settings had an older version, save the migrated settings immediately
    if (data.version !== CURRENT_SETTINGS_VERSION) {
      saveSettings(useSettingsStore.getState());
    }
  } catch (err) {
    logger.error(`Failed to load settings from JSON file: ${err}`);
  } finally {
    onLoadingChange(false);
  }
};
