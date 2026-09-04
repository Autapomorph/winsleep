import {
  disable as disableAutostart,
  enable as enableAutostart,
} from '@tauri-apps/plugin-autostart';
import { type StateCreator } from 'zustand';

import { typedInvoke } from '@/shared/api';
import {
  type UpdateInterval,
  DEFAULT_HAS_SEEN_TRAY_NOTIFICATION,
  DEFAULT_IS_AUTO_UPDATE_ENABLED,
  DEFAULT_IS_AUTOSTART_ENABLED,
  DEFAULT_IS_START_MINIMIZED_ENABLED,
  DEFAULT_IS_TRAY_MODE_ENABLED,
  DEFAULT_UPDATE_INTERVAL,
} from '@/shared/config';
import { logger } from '@/shared/lib';
import { type SettingsStore } from '../settings.store';

export type SystemSlice = SystemState & SystemActions;

export interface SystemState {
  isTrayModeEnabled: boolean;
  isAutostartEnabled: boolean;
  isStartMinimizedEnabled: boolean;
  isAutoUpdateEnabled: boolean;
  updateInterval: UpdateInterval;
  hasSeenTrayNotification: boolean;
}

export interface SystemActions {
  setIsTrayModeEnabled: (isTrayModeEnabled: boolean) => void;
  setIsAutostartEnabled: (isAutostartEnabled: boolean) => void;
  setIsStartMinimizedEnabled: (isStartMinimizedEnabled: boolean) => void;
  setIsAutoUpdateEnabled: (isAutoUpdateEnabled: boolean) => void;
  setUpdateInterval: (updateInterval: UpdateInterval) => void;
  setHasSeenTrayNotification: (hasSeenTrayNotification: boolean) => void;
}

export const initialSystemState: SystemState = {
  hasSeenTrayNotification: DEFAULT_HAS_SEEN_TRAY_NOTIFICATION,
  isAutostartEnabled: DEFAULT_IS_AUTOSTART_ENABLED,
  isAutoUpdateEnabled: DEFAULT_IS_AUTO_UPDATE_ENABLED,
  isStartMinimizedEnabled: DEFAULT_IS_START_MINIMIZED_ENABLED,
  isTrayModeEnabled: DEFAULT_IS_TRAY_MODE_ENABLED,
  updateInterval: DEFAULT_UPDATE_INTERVAL,
};

export const createSystemSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  SystemSlice
> = set => ({
  ...initialSystemState,

  setHasSeenTrayNotification: hasSeenTrayNotification => {
    set({ hasSeenTrayNotification }, false, 'settings/setHasSeenTrayNotification');
  },

  setIsAutostartEnabled: isAutostartEnabled => {
    set({ isAutostartEnabled }, false, 'settings/setIsAutostartEnabled');

    if (isAutostartEnabled) {
      enableAutostart().catch(err => {
        logger.error(`Failed to enable autostart: ${err}`);
      });
    } else {
      disableAutostart().catch(err => {
        logger.error(`Failed to disable autostart: ${err}`);
      });
    }
  },

  setIsAutoUpdateEnabled: isAutoUpdateEnabled => {
    set({ isAutoUpdateEnabled }, false, 'settings/setIsAutoUpdateEnabled');
  },

  setIsStartMinimizedEnabled: isStartMinimizedEnabled => {
    set({ isStartMinimizedEnabled }, false, 'settings/setIsStartMinimizedEnabled');
  },

  setIsTrayModeEnabled: isTrayModeEnabled => {
    set(
      { hasSeenTrayNotification: false, isTrayModeEnabled },
      false,
      'settings/setIsTrayModeEnabled',
    );

    typedInvoke('set_is_tray_mode_enabled', { isEnabled: isTrayModeEnabled }).catch(err => {
      logger.error(`Failed to sync tray mode: ${err}`);
    });
  },

  setUpdateInterval: updateInterval => {
    set({ updateInterval }, false, 'settings/setUpdateInterval');
  },
});
