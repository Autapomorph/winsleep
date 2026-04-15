import { useTranslation } from 'react-i18next';

import { logger, showErrorToast, showInfoToast } from '@/shared/lib';
import { useUpdateStore } from '../model/updateStore';

export const useUpdater = () => {
  const { t } = useTranslation();

  const update = async () => {
    const { status, installUpdate, relaunchApp, checkUpdates } = useUpdateStore.getState();

    if (status === 'available') {
      await installUpdate();
      return;
    }

    if (status === 'readyToRestart') {
      try {
        await relaunchApp();
      } catch (err) {
        logger.error(`Failed to relaunch application: ${err}`);
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
