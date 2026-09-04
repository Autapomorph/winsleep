import { typedInvoke } from '@/shared/api';
import { logger } from '@/shared/lib';
import { useAppStateStore } from './appState.store';
import { loadAndApplyAppState } from './loadAndApplyAppState';
import { serializeAppState } from './serialize';

export const initializeAppState = async () => {
  let isUpdatingFromDisk = false;

  const persistState = (state: ReturnType<typeof useAppStateStore.getState>) => {
    const stateToSave = serializeAppState(state);

    typedInvoke('save_app_state', {
      state: stateToSave,
    }).catch(err => {
      logger.error(`Failed to save app state: ${err}`);
    });
  };

  const saveAppState = (state: ReturnType<typeof useAppStateStore.getState>) => {
    if (isUpdatingFromDisk) {
      return;
    }

    persistState(state);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    isUpdatingFromDisk = isLoading;
  };

  // Initial load: pass persistState so it can save default state if file does not exist on disk
  await loadAndApplyAppState(handleLoadingChange, persistState);

  // Subscribe to app state store changes and save them to the state.json file
  useAppStateStore.subscribe(saveAppState);
};
