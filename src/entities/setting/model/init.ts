import { typedInvoke, typedListen } from '@/shared/api';
import { logger } from '@/shared/lib';
import { loadAndApplySettings } from './loadAndApplySettings';
import { serializeSettings } from './serialize';
import { useSettingsStore } from './settingsStore';

export const initializeSettings = async () => {
  let isUpdatingFromDisk = false;

  const persistSettings = (state: ReturnType<typeof useSettingsStore.getState>) => {
    const settingsToSave = serializeSettings(state);

    typedInvoke('save_settings', { settings: settingsToSave }).catch(err => {
      logger.error(`Failed to save settings: ${err}`);
    });
  };

  const saveSettings = (state: ReturnType<typeof useSettingsStore.getState>) => {
    if (isUpdatingFromDisk) {
      return;
    }

    persistSettings(state);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    isUpdatingFromDisk = isLoading;
  };

  // Initial load
  await loadAndApplySettings(handleLoadingChange, persistSettings);

  // Listen for external settings file changes
  typedListen('settings-external-change', async () => {
    logger.info('External settings.json change detected. Reloading...');
    await loadAndApplySettings(handleLoadingChange, persistSettings);
  }).catch(err => {
    logger.error(`Failed to listen for settings changes: ${err}`);
  });

  // Subscribe to settings store changes and save them to the JSON file
  useSettingsStore.subscribe(saveSettings);
};
