import { typedInvoke } from '@/shared/api';
import { logger } from '../logger/logger';

export const playSystemNotificationSound = async () => {
  try {
    await typedInvoke('play_notification_sound');
  } catch (error) {
    logger.error(`Failed to play system notification sound: ${error}`);
  }
};
