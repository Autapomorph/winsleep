import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';
import { FaFolderOpen } from 'react-icons/fa6';

import { typedInvoke } from '@/shared/api';
import { logger } from '@/shared/lib';

export const OpenSettingsDir = () => {
  const { t } = useTranslation();

  const handleOpenSettingsDir = async () => {
    try {
      await typedInvoke('open_settings_dir');
    } catch (error) {
      logger.error(`Failed to open settings directory: ${error}`);
    }
  };

  return (
    <Button variant="ghost" onPress={handleOpenSettingsDir}>
      <FaFolderOpen />
      {t($ => $.settings.sections.general.groups.dangerZone.openInExplorer)}
    </Button>
  );
};
