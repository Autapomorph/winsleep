import { typedInvoke } from '@/shared/api';
import { logger } from '@/shared/lib';
import { useAppStateStore } from './appStateStore';
import { deserializeAppState } from './deserialize';
import { CURRENT_APP_STATE_VERSION, migrateAppState } from './migrate';

export const loadAndApplyAppState = async (
  onLoadingChange: (isLoading: boolean) => void,
  saveAppState: (state: ReturnType<typeof useAppStateStore.getState>) => void,
) => {
  onLoadingChange(true);

  try {
    const data = await typedInvoke('load_app_state');

    if (!data) {
      // File does not exist, save current (default) state immediately
      saveAppState(useAppStateStore.getState());
      return;
    }

    const { state: rawState } = migrateAppState(data);
    const appState = deserializeAppState(rawState);

    useAppStateStore.setState(appState);

    // If the loaded state had an older version, save the migrated state immediately
    if (data.version !== CURRENT_APP_STATE_VERSION) {
      saveAppState(useAppStateStore.getState());
    }
  } catch (err) {
    logger.error(`Failed to load app state from JSON file: ${err}`);
  } finally {
    onLoadingChange(false);
  }
};
