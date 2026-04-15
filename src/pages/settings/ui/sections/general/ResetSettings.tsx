import { useTranslation } from 'react-i18next';
import { AlertDialog, Button } from '@heroui/react';
import { FaTrash } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import { logger, showInfoToast } from '@/shared/lib';

export const ResetSettings = () => {
  const { t } = useTranslation();
  const resetToDefaults = useSettingsStore(state => state.resetToDefaults);

  const handleReset = () => {
    resetToDefaults();
    logger.info('Reset settings to default values');
    showInfoToast($ => $.settings.sections.general.groups.dangerZone.notifications.reset.success);
  };

  return (
    <AlertDialog>
      <Button variant="danger-soft">
        <FaTrash />
        {t($ => $.settings.sections.general.groups.dangerZone.reset.text)}
      </Button>

      <AlertDialog.Backdrop isDismissable isKeyboardDismissDisabled={false}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />

            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>
                {t($ => $.settings.sections.general.groups.dangerZone.reset.confirm.title)}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              {t($ => $.settings.sections.general.groups.dangerZone.reset.confirm.body)}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                {t($ => $.settings.sections.general.groups.dangerZone.reset.confirm.cancelBtn)}
              </Button>

              <Button slot="close" variant="danger-soft" onPress={handleReset}>
                {t($ => $.settings.sections.general.groups.dangerZone.reset.confirm.confirmBtn)}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
};
