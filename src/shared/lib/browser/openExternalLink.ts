import { openUrl } from '@tauri-apps/plugin-opener';

import { logger } from '../logger/logger';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const openExternalLink = async (url: string) => {
  try {
    const parsedUrl = new URL(url);

    if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
      logger.warn(`Blocked attempt to open unsafe URL protocol: ${parsedUrl.protocol} (${url})`);
      return;
    }

    await openUrl(url);
  } catch (err) {
    logger.error(`Failed to open URL: ${url}. Error: ${err}`);
  }
};
