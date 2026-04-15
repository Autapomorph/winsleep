import type { Tone } from '@/shared/lib';

export type NotificationSound = 'system' | 'app';

export const DEFAULT_NOTIFICATION_SECONDS = 60;

export const DEFAULT_NOTIFICATION_TIMES: number[] = [DEFAULT_NOTIFICATION_SECONDS];

export const DEFAULT_IS_NOTIFICATIONS_ENABLED = true;

export const DEFAULT_IS_NOTIFICATION_SOUND_ENABLED = true;

export const DEFAULT_NOTIFICATION_SOUND_TYPE: NotificationSound = 'system';

export const DEFAULT_CUSTOM_NOTIFICATION_SOUND: Tone[] = [
  // E5
  {
    freq: 659.25,
    startTime: 0,
    duration: 0.3,
  },

  // A5
  {
    freq: 880.0,
    startTime: 0 + 0.15,
    duration: 0.5,
  },
];
