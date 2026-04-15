import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';
import { FaCopy } from 'react-icons/fa6';

import { serializeSettings, useSettingsStore } from '@/entities/setting';
import { logger, showInfoToast } from '@/shared/lib';

export const ExportSettings = () => {
  const { t } = useTranslation();

  const handleExportSettings = async () => {
    const state = useSettingsStore.getState();
    const settingsToExport = serializeSettings(state);

    try {
      await writeText(JSON.stringify(settingsToExport, null, 2));
      showInfoToast(
        $ => $.settings.sections.general.groups.dangerZone.notifications.export.success,
      );
    } catch (error) {
      logger.error(`Failed to export settings to clipboard: ${error}`);
    }
  };

  return (
    <Button variant="ghost" onPress={handleExportSettings}>
      <FaCopy />
      {t($ => $.settings.sections.general.groups.dangerZone.exportSettings)}
    </Button>
  );
};
