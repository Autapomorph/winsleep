import { type StateCreator } from 'zustand';

import {
  type NotificationSound,
  DEFAULT_IS_NOTIFICATION_SOUND_ENABLED,
  DEFAULT_IS_NOTIFICATIONS_ENABLED,
  DEFAULT_NOTIFICATION_SOUND_TYPE,
  DEFAULT_NOTIFICATION_TIMES,
} from '@/shared/config';
import { type NotificationTime } from '../notificationTime';
import { type SettingsStore } from '../settings.store';

export type NotificationSlice = NotificationState & NotificationActions;

export interface NotificationState {
  isNotificationsEnabled: boolean;
  notificationTimes: NotificationTime[];
  isNotificationSoundEnabled: boolean;
  notificationSoundType: NotificationSound;
}

export interface NotificationActions {
  setIsNotificationsEnabled: (isNotificationsEnabled: boolean) => void;
  addNotificationTime: (notificationTimeSeconds: number) => void;
  removeNotificationTime: (id: string) => void;
  updateNotificationTime: (id: string, seconds: number) => void;
  setNotificationTimes: (times: NotificationTime[]) => void;
  setIsNotificationSoundEnabled: (isNotificationSoundEnabled: boolean) => void;
  setNotificationSoundType: (notificationSoundType: NotificationSound) => void;
}

export const initialNotificationState: NotificationState = {
  isNotificationSoundEnabled: DEFAULT_IS_NOTIFICATION_SOUND_ENABLED,
  isNotificationsEnabled: DEFAULT_IS_NOTIFICATIONS_ENABLED,
  notificationSoundType: DEFAULT_NOTIFICATION_SOUND_TYPE,
  notificationTimes: DEFAULT_NOTIFICATION_TIMES.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  })),
};

export const createNotificationSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  NotificationSlice
> = set => ({
  ...initialNotificationState,

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

  setIsNotificationSoundEnabled: isNotificationSoundEnabled =>
    set({ isNotificationSoundEnabled }, false, 'settings/setIsNotificationSoundEnabled'),

  setIsNotificationsEnabled: isNotificationsEnabled =>
    set({ isNotificationsEnabled }, false, 'settings/setIsNotificationsEnabled'),

  setNotificationSoundType: notificationSoundType =>
    set({ notificationSoundType }, false, 'settings/setNotificationSoundType'),

  setNotificationTimes: times =>
    set(
      { notificationTimes: [...times].sort((a, b) => a.seconds - b.seconds) },
      false,
      'settings/setNotificationTimes',
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
});
