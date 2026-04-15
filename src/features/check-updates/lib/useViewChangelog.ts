import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';

import { useUpdateStore } from '@/entities/updater';
import { logger, showErrorToast } from '@/shared/lib';

export const useViewChangelog = () => {
  const { t } = useTranslation();
  const openChangelog = useUpdateStore(state => state.openChangelog);

  const viewChangelog = async () => {
    try {
      const currentVersion = await getVersion();
      openChangelog(currentVersion);
    } catch (err) {
      logger.error(`Failed to view changelog: ${err}`);
      showErrorToast(t($ => $.titlebar.updateBtn.notifications.checkFailed));
    }
  };

  return viewChangelog;
};
