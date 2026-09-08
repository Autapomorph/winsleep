import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const IsNotificationSoundEnabledSwitch = () => {
  const { t } = useTranslation();
  const { isNotificationsEnabled, isNotificationSoundEnabled, setIsNotificationSoundEnabled } =
    useSettingsStore(
      useShallow(state => ({
        isNotificationsEnabled: state.isNotificationsEnabled,
        isNotificationSoundEnabled: state.isNotificationSoundEnabled,
        setIsNotificationSoundEnabled: state.setIsNotificationSoundEnabled,
      })),
    );

  return (
    <Switch
      isSelected={isNotificationSoundEnabled}
      onChange={setIsNotificationSoundEnabled}
      isDisabled={!isNotificationsEnabled}
      className="w-full"
    >
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.notifications.groups.sound.playSound.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
