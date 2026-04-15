import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { AlertDialog, Button } from '@heroui/react';
import { FaCopy, FaFolderOpen, FaTrash } from 'react-icons/fa6';

import { useDebugLogsStore } from '@/entities/log';
import { typedInvoke } from '@/shared/api';
import { logger, showInfoToast } from '@/shared/lib';

export const LogActions = () => {
  const { t } = useTranslation();
  const { rawLogs, clearLogs } = useDebugLogsStore(
    useShallow(state => ({
      rawLogs: state.rawLogs,
      clearLogs: state.clearLogs,
    })),
  );

  // Clear logs handler
  const handleClearLogs = async () => {
    try {
      await clearLogs();
      showInfoToast($ => $.settings.sections.debug.groups.actions.notifications.clear.success);
    } catch (error) {
      logger.error(`Failed to clear logs: ${error}`);
    }
  };

  // Open log folder in explorer handler
  const handleOpenLogDir = async () => {
    try {
      await typedInvoke('open_log_dir');
    } catch (error) {
      logger.error(`Failed to open log directory: ${error}`);
    }
  };

  // Export logs to clipboard handler
  const handleExportLogs = async () => {
    try {
      await writeText(rawLogs);
      showInfoToast($ => $.settings.sections.debug.groups.actions.notifications.export.success);
    } catch (error) {
      logger.error(`Failed to export logs to clipboard: ${error}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Export logs */}
      <Button variant="ghost" onPress={handleExportLogs}>
        <FaCopy />
        {t($ => $.settings.sections.debug.groups.actions.exportLogs)}
      </Button>

      {/* Open in File Explorer */}
      <Button variant="ghost" onPress={handleOpenLogDir}>
        <FaFolderOpen />
        {t($ => $.settings.sections.debug.groups.actions.openInExplorer)}
      </Button>

      {/* Clear logs with Dialog confirmation */}
      <AlertDialog>
        <Button variant="danger-soft">
          <FaTrash />
          {t($ => $.settings.sections.debug.groups.actions.clear)}
        </Button>

        <AlertDialog.Backdrop isDismissable isKeyboardDismissDisabled={false}>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />

              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>
                  {t($ => $.settings.sections.debug.groups.actions.clearConfirm.title)}
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body>
                {t($ => $.settings.sections.debug.groups.actions.clearConfirm.body)}
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary">
                  {t($ => $.settings.sections.debug.groups.actions.clearConfirm.cancelBtn)}
                </Button>

                <Button slot="close" variant="danger-soft" onPress={handleClearLogs}>
                  {t($ => $.settings.sections.debug.groups.actions.clearConfirm.confirmBtn)}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
};
