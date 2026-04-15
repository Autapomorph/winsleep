import {
  type Options,
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

import { logger } from '../logger/logger';

/**
 * Sends a native system notification, checking and requesting permission if needed.
 * @returns Promise<boolean> resolving to true if the notification was sent successfully.
 */
export const sendSystemNotification = async (options: Options | string): Promise<boolean> => {
  try {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      const notificationOptions = typeof options === 'string' ? { title: options } : options;
      sendNotification(notificationOptions);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Failed to send system notification: ${error}`);
    return false;
  }
};
