import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const IsNotificationEnabledSwitch = () => {
  const { t } = useTranslation();
  const { isNotificationsEnabled, setIsNotificationsEnabled } = useSettingsStore(
    useShallow(state => ({
      isNotificationsEnabled: state.isNotificationsEnabled,
      setIsNotificationsEnabled: state.setIsNotificationsEnabled,
    })),
  );

  return (
    <Switch
      isSelected={isNotificationsEnabled}
      onChange={setIsNotificationsEnabled}
      className="w-full"
    >
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.notifications.groups.basic.enableNotifications.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
