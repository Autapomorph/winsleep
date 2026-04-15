import { openUrl } from '@tauri-apps/plugin-opener';

import { logger } from '../logger/logger';

export const openExternalLink = async (url: string) => {
  try {
    await openUrl(url);
  } catch (err) {
    logger.error(`Failed to open URL: ${url}. Error: ${err}`);
  }
};
