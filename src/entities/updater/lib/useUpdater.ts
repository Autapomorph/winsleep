import { useTranslation } from 'react-i18next';

import { config } from '@/shared/config';
import { logger, openExternalLink, showErrorToast, showInfoToast } from '@/shared/lib';
import { updateService } from '../api/update.service';
import { useUpdateStore } from '../model/update.store';

export const useUpdater = () => {
  const { t } = useTranslation();

  const update = async () => {
    const { status, installUpdate, relaunchApp, checkUpdates } = useUpdateStore.getState();

    if (config.isPortable && (status === 'available' || status === 'readyToInstall')) {
      await openExternalLink(updateService.getReleasesUrl());
      showInfoToast(t($ => $.titlebar.updateBtn.notifications.portableDownload));
      return;
    }

    if (status === 'available') {
      await installUpdate();
      return;
    }

    if (status === 'readyToInstall') {
      try {
        await installUpdate();
        await relaunchApp();
      } catch (err) {
        logger.error(`Failed to install and relaunch application: ${err}`);
        showErrorToast(t($ => $.titlebar.updateBtn.notifications.relaunchFailed));
      }

      return;
    }

    logger.info('Checking for updates');
    await checkUpdates({ isManual: true });
    const updateStatus = useUpdateStore.getState().status;

    if (updateStatus === 'error') {
      logger.error('Manual update check failed');
      showErrorToast(t($ => $.titlebar.updateBtn.notifications.checkFailed));
      return;
    }

    if (updateStatus === 'upToDate') {
      logger.info('Application is up to date');
      showInfoToast(t($ => $.titlebar.updateBtn.notifications.upToDate));
    }
  };

  return update;
};
