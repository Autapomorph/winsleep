import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';

import { useUpdateStore } from '@/entities/updater';
import { logger, showErrorToast } from '@/shared/lib';

export const useViewReleaseNotes = () => {
  const { t } = useTranslation();
  const openReleaseNotes = useUpdateStore(state => state.openReleaseNotes);

  const viewReleaseNotes = async () => {
    try {
      const currentVersion = await getVersion();
      openReleaseNotes(currentVersion);
    } catch (err) {
      logger.error(`Failed to view release notes: ${err}`);
      showErrorToast(t($ => $.titlebar.updateBtn.notifications.checkFailed));
    }
  };

  return viewReleaseNotes;
};
