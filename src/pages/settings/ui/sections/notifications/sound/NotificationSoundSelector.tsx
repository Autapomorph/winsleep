import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Label, ListBox, Select } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const NotificationSoundSelector = () => {
  const { t } = useTranslation();
  const {
    isNotificationsEnabled,
    isNotificationSoundEnabled,
    notificationSoundType,
    setNotificationSoundType,
  } = useSettingsStore(
    useShallow(state => ({
      isNotificationsEnabled: state.isNotificationsEnabled,
      isNotificationSoundEnabled: state.isNotificationSoundEnabled,
      notificationSoundType: state.notificationSoundType,
      setNotificationSoundType: state.setNotificationSoundType,
    })),
  );

  return (
    <Select
      variant="secondary"
      value={notificationSoundType}
      isDisabled={!isNotificationsEnabled || !isNotificationSoundEnabled}
      placeholder={t($ => $.settings.sections.notifications.groups.sound.soundType.select.label)}
      onChange={value => {
        if (value !== null) {
          setNotificationSoundType(value as 'system' | 'app');
        }
      }}
    >
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.notifications.groups.sound.soundType.select.label)}
      </Label>

      <Select.Trigger className="mt-1">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          <ListBox.Item
            id="system"
            textValue={t(
              $ => $.settings.sections.notifications.groups.sound.soundType.select.options.system,
            )}
          >
            {t($ => $.settings.sections.notifications.groups.sound.soundType.select.options.system)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item
            id="app"
            textValue={t(
              $ => $.settings.sections.notifications.groups.sound.soundType.select.options.app,
            )}
          >
            {t($ => $.settings.sections.notifications.groups.sound.soundType.select.options.app)}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
