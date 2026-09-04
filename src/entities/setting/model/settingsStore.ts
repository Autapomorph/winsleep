import {
  disable as disableAutostart,
  enable as enableAutostart,
} from '@tauri-apps/plugin-autostart';
import { type StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { typedInvoke } from '@/shared/api';
import {
  type NotificationSound,
  type TimerAction,
  type UpdateInterval,
  DEFAULT_CUSTOM_TIMER_PRESETS,
  DEFAULT_HAS_SEEN_TRAY_NOTIFICATION,
  DEFAULT_IS_AUTO_UPDATE_ENABLED,
  DEFAULT_IS_AUTOSTART_ENABLED,
  DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED,
  DEFAULT_IS_LOCKED_BY_DEFAULT,
  DEFAULT_IS_NOTIFICATION_SOUND_ENABLED,
  DEFAULT_IS_NOTIFICATIONS_ENABLED,
  DEFAULT_IS_RESTORE_SCHEDULED_TIMER_ON_STARTUP_ENABLED,
  DEFAULT_IS_START_MINIMIZED_ENABLED,
  DEFAULT_IS_TRAY_MODE_ENABLED,
  DEFAULT_NOTIFICATION_SOUND_TYPE,
  DEFAULT_NOTIFICATION_TIMES,
  DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME,
  DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
  DEFAULT_TIMER_ACTION,
  DEFAULT_TIMER_SECONDS,
  DEFAULT_TIMER_STEP_SECONDS,
  DEFAULT_UPDATE_INTERVAL,
} from '@/shared/config';
import { logger } from '@/shared/lib';
import { type NotificationTime } from './notificationTime';
import { type CustomTimerPreset } from './timerPreset';

type SettingsStore = TimerActionSlice & TimerSlice & NotificationSlice & SystemSlice & GeneralSlice;

export type SettingsState = TimerActionState & TimerState & NotificationState & SystemState;

type TimerActionSlice = TimerActionState & TimerActionActions;

interface TimerActionState {
  defaultTimerAction: TimerAction;
  shouldRememberSelectedTimerAction: boolean;
}

interface TimerActionActions {
  setDefaultTimerAction: (defaultTimerAction: TimerAction) => void;
  setShouldRememberSelectedTimerAction: (shouldRememberSelectedTimerAction: boolean) => void;
}

type TimerSlice = TimerState & TimerActions;

interface TimerState {
  defaultTimerSeconds: number;
  shouldRememberConfiguredTime: boolean;
  isLockedByDefault: boolean;
  isRestoreScheduledTimerOnStartupEnabled: boolean;
  isCustomTimerStepsEnabled: boolean;
  timerStepIncrease: number;
  timerStepDecrease: number;
  customTimerPresets: CustomTimerPreset[];
}

interface TimerActions {
  setDefaultTimerSeconds: (defaultTimerSeconds: number) => void;
  setShouldRememberConfiguredTime: (shouldRememberConfiguredTime: boolean) => void;
  setIsLockedByDefault: (isLockedByDefault: boolean) => void;
  setIsRestoreScheduledTimerOnStartupEnabled: (
    isRestoreScheduledTimerOnStartupEnabled: boolean,
  ) => void;
  setIsCustomTimerStepsEnabled: (isCustomTimerStepsEnabled: boolean) => void;
  setTimerStepIncrease: (timerStepIncrease: number) => void;
  setTimerStepDecrease: (timerStepDecrease: number) => void;
  addCustomTimerPreset: (customTimerPresetSeconds: number) => void;
  updateCustomTimerPreset: (id: string, preset: Partial<Omit<CustomTimerPreset, 'id'>>) => void;
  removeCustomTimerPreset: (id: string) => void;
}

type NotificationSlice = NotificationState & NotificationActions;

interface NotificationState {
  isNotificationsEnabled: boolean;
  notificationTimes: NotificationTime[];
  isNotificationSoundEnabled: boolean;
  notificationSoundType: NotificationSound;
}

interface NotificationActions {
  setIsNotificationsEnabled: (isNotificationsEnabled: boolean) => void;
  addNotificationTime: (notificationTimeSeconds: number) => void;
  removeNotificationTime: (id: string) => void;
  updateNotificationTime: (id: string, seconds: number) => void;
  setNotificationTimes: (times: NotificationTime[]) => void;
  setIsNotificationSoundEnabled: (isNotificationSoundEnabled: boolean) => void;
  setNotificationSoundType: (notificationSoundType: NotificationSound) => void;
}

type SystemSlice = SystemState & SystemActions;

interface SystemState {
  isTrayModeEnabled: boolean;
  isAutostartEnabled: boolean;
  isStartMinimizedEnabled: boolean;
  isAutoUpdateEnabled: boolean;
  updateInterval: UpdateInterval;
  hasSeenTrayNotification: boolean;
}

interface SystemActions {
  setIsTrayModeEnabled: (isTrayModeEnabled: boolean) => void;
  setIsAutostartEnabled: (isAutostartEnabled: boolean) => void;
  setIsStartMinimizedEnabled: (isStartMinimizedEnabled: boolean) => void;
  setIsAutoUpdateEnabled: (isAutoUpdateEnabled: boolean) => void;
  setUpdateInterval: (updateInterval: UpdateInterval) => void;
  setHasSeenTrayNotification: (hasSeenTrayNotification: boolean) => void;
}

interface GeneralActions {
  resetToDefaults: () => void;
}

type GeneralSlice = GeneralActions;

const initialActionState = {
  defaultTimerAction: DEFAULT_TIMER_ACTION,
  shouldRememberSelectedTimerAction: DEFAULT_SHOULD_REMEMBER_SELECTED_TIMER_ACTION,
};

const initialTimerState = {
  defaultTimerSeconds: DEFAULT_TIMER_SECONDS,
  shouldRememberConfiguredTime: DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME,
  isCustomTimerStepsEnabled: DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED,
  timerStepIncrease: DEFAULT_TIMER_STEP_SECONDS,
  timerStepDecrease: DEFAULT_TIMER_STEP_SECONDS,
  customTimerPresets: DEFAULT_CUSTOM_TIMER_PRESETS.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  })),
  isLockedByDefault: DEFAULT_IS_LOCKED_BY_DEFAULT,
  isRestoreScheduledTimerOnStartupEnabled: DEFAULT_IS_RESTORE_SCHEDULED_TIMER_ON_STARTUP_ENABLED,
};

const initialNotificationState = {
  isNotificationsEnabled: DEFAULT_IS_NOTIFICATIONS_ENABLED,
  notificationTimes: DEFAULT_NOTIFICATION_TIMES.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  })),
  isNotificationSoundEnabled: DEFAULT_IS_NOTIFICATION_SOUND_ENABLED,
  notificationSoundType: DEFAULT_NOTIFICATION_SOUND_TYPE,
};

const initialSystemState = {
  isTrayModeEnabled: DEFAULT_IS_TRAY_MODE_ENABLED,
  isAutostartEnabled: DEFAULT_IS_AUTOSTART_ENABLED,
  isStartMinimizedEnabled: DEFAULT_IS_START_MINIMIZED_ENABLED,
  isAutoUpdateEnabled: DEFAULT_IS_AUTO_UPDATE_ENABLED,
  updateInterval: DEFAULT_UPDATE_INTERVAL,
  hasSeenTrayNotification: DEFAULT_HAS_SEEN_TRAY_NOTIFICATION,
};

const initialState = {
  ...initialActionState,
  ...initialTimerState,
  ...initialNotificationState,
  ...initialSystemState,
};

const createActionSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  TimerActionSlice
> = set => ({
  ...initialActionState,
  setDefaultTimerAction: defaultTimerAction =>
    set({ defaultTimerAction }, false, 'settings/setDefaultTimerAction'),
  setShouldRememberSelectedTimerAction: shouldRememberSelectedTimerAction =>
    set(
      { shouldRememberSelectedTimerAction },
      false,
      'settings/setShouldRememberSelectedTimerAction',
    ),
});

const createTimerSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  TimerSlice
> = set => ({
  ...initialTimerState,
  setDefaultTimerSeconds: defaultTimerSeconds =>
    set({ defaultTimerSeconds }, false, 'settings/setDefaultTimerSeconds'),
  setShouldRememberConfiguredTime: shouldRememberConfiguredTime =>
    set({ shouldRememberConfiguredTime }, false, 'settings/setShouldRememberConfiguredTime'),
  setIsLockedByDefault: isLockedByDefault =>
    set({ isLockedByDefault }, false, 'settings/setIsLockedByDefault'),
  setIsRestoreScheduledTimerOnStartupEnabled: isRestoreScheduledTimerOnStartupEnabled =>
    set(
      { isRestoreScheduledTimerOnStartupEnabled },
      false,
      'settings/setIsRestoreScheduledTimerOnStartupEnabled',
    ),
  setIsCustomTimerStepsEnabled: isCustomTimerStepsEnabled =>
    set({ isCustomTimerStepsEnabled }, false, 'settings/setIsCustomTimerStepsEnabled'),
  setTimerStepIncrease: timerStepIncrease =>
    set({ timerStepIncrease }, false, 'settings/setTimerStepIncrease'),
  setTimerStepDecrease: timerStepDecrease =>
    set({ timerStepDecrease }, false, 'settings/setTimerStepDecrease'),
  addCustomTimerPreset: customTimerPresetSeconds =>
    set(
      state => ({
        customTimerPresets: [
          ...state.customTimerPresets,
          { id: crypto.randomUUID(), seconds: customTimerPresetSeconds },
        ],
      }),
      false,
      'settings/addCustomTimerPreset',
    ),
  removeCustomTimerPreset: id =>
    set(
      state => ({
        customTimerPresets: state.customTimerPresets.filter(p => p.id !== id),
      }),
      false,
      'settings/removeCustomTimerPreset',
    ),
  updateCustomTimerPreset: (id, preset) =>
    set(
      state => ({
        customTimerPresets: state.customTimerPresets.map(p =>
          p.id === id ? { ...p, ...preset } : p,
        ),
      }),
      false,
      'settings/updateCustomTimerPreset',
    ),
});

const createNotificationSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  NotificationSlice
> = set => ({
  ...initialNotificationState,
  setIsNotificationsEnabled: isNotificationsEnabled =>
    set({ isNotificationsEnabled }, false, 'settings/setIsNotificationsEnabled'),
  addNotificationTime: notificationTimeSeconds =>
    set(
      state => {
        if (state.notificationTimes.some(t => t.seconds === notificationTimeSeconds)) {
          return state;
        }

        return {
          notificationTimes: [
            ...state.notificationTimes,
            { id: crypto.randomUUID(), seconds: notificationTimeSeconds },
          ].sort((a, b) => a.seconds - b.seconds),
        };
      },
      false,
      'settings/addNotificationTime',
    ),
  removeNotificationTime: id =>
    set(
      state => ({
        notificationTimes: state.notificationTimes.filter(t => t.id !== id),
      }),
      false,
      'settings/removeNotificationTime',
    ),
  updateNotificationTime: (id, seconds) =>
    set(
      state => {
        if (state.notificationTimes.some(t => t.id !== id && t.seconds === seconds)) {
          return state;
        }

        return {
          notificationTimes: state.notificationTimes
            .map(t => (t.id === id ? { ...t, seconds } : t))
            .sort((a, b) => a.seconds - b.seconds),
        };
      },
      false,
      'settings/updateNotificationTime',
    ),
  setNotificationTimes: times =>
    set(
      { notificationTimes: [...times].sort((a, b) => a.seconds - b.seconds) },
      false,
      'settings/setNotificationTimes',
    ),
  setIsNotificationSoundEnabled: isNotificationSoundEnabled =>
    set({ isNotificationSoundEnabled }, false, 'settings/setIsNotificationSoundEnabled'),
  setNotificationSoundType: notificationSoundType =>
    set({ notificationSoundType }, false, 'settings/setNotificationSoundType'),
});

const createSystemSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  SystemSlice
> = set => ({
  ...initialSystemState,
  setIsTrayModeEnabled: isTrayModeEnabled => {
    set(
      { isTrayModeEnabled, hasSeenTrayNotification: false },
      false,
      'settings/setIsTrayModeEnabled',
    );

    typedInvoke('set_is_tray_mode_enabled', { isEnabled: isTrayModeEnabled }).catch(err =>
      logger.error(`Failed to sync tray mode: ${err}`),
    );
  },
  setIsAutostartEnabled: isAutostartEnabled => {
    set({ isAutostartEnabled }, false, 'settings/setIsAutostartEnabled');

    if (isAutostartEnabled) {
      enableAutostart().catch(err => logger.error(`Failed to enable autostart: ${err}`));
    } else {
      disableAutostart().catch(err => logger.error(`Failed to disable autostart: ${err}`));
    }
  },
  setIsStartMinimizedEnabled: isStartMinimizedEnabled =>
    set({ isStartMinimizedEnabled }, false, 'settings/setIsStartMinimizedEnabled'),
  setIsAutoUpdateEnabled: isAutoUpdateEnabled =>
    set({ isAutoUpdateEnabled }, false, 'settings/setIsAutoUpdateEnabled'),
  setUpdateInterval: updateInterval => set({ updateInterval }, false, 'settings/setUpdateInterval'),
  setHasSeenTrayNotification: hasSeenTrayNotification =>
    set({ hasSeenTrayNotification }, false, 'settings/setHasSeenTrayNotification'),
});

const createGeneralSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  GeneralActions
> = (set, get) => ({
  resetToDefaults: () =>
    set(
      {
        ...initialState,
        hasSeenTrayNotification: get().hasSeenTrayNotification,
      },
      false,
      'settings/resetToDefaults',
    ),
});

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (...a) => ({
      ...createActionSlice(...a),
      ...createTimerSlice(...a),
      ...createNotificationSlice(...a),
      ...createSystemSlice(...a),
      ...createGeneralSlice(...a),
    }),
    {
      name: 'settings',
    },
  ),
);
