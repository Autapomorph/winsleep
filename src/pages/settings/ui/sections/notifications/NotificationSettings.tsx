import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Chip, CloseButton, Label, ListBox, Select, Switch, Toolbar } from '@heroui/react';
import { FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_NOTIFICATION_SECONDS } from '@/shared/config';
import { formatDurationFull } from '@/shared/lib';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';
import { NotificationTimeEditModal } from '../../modals/NotificationTimeEditModal';

export const NotificationSettings = () => {
  const { t } = useTranslation();
  const [editingNotificationTimeId, setEditingNotificationTimeId] = useState<string | null>(null);

  const {
    isNotificationsEnabled,
    notificationTimes,
    isNotificationSoundEnabled,
    notificationSoundType,
    setIsNotificationsEnabled,
    addNotificationTime,
    removeNotificationTime,
    updateNotificationTime,
    setIsNotificationSoundEnabled,
    setNotificationSoundType,
  } = useSettingsStore(
    useShallow(state => ({
      isNotificationsEnabled: state.isNotificationsEnabled,
      notificationTimes: state.notificationTimes,
      isNotificationSoundEnabled: state.isNotificationSoundEnabled,
      notificationSoundType: state.notificationSoundType,
      setIsNotificationsEnabled: state.setIsNotificationsEnabled,
      addNotificationTime: state.addNotificationTime,
      removeNotificationTime: state.removeNotificationTime,
      updateNotificationTime: state.updateNotificationTime,
      setIsNotificationSoundEnabled: state.setIsNotificationSoundEnabled,
      setNotificationSoundType: state.setNotificationSoundType,
    })),
  );

  const NEW_NOTIFICATION_TIME_ID = 'new';

  const editingNotificationTime =
    editingNotificationTimeId === NEW_NOTIFICATION_TIME_ID
      ? { id: NEW_NOTIFICATION_TIME_ID, seconds: DEFAULT_NOTIFICATION_SECONDS }
      : notificationTimes.find(timePoint => timePoint.id === editingNotificationTimeId);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.notifications.title)}
      </h2>

      {/* Group Basic */}
      <SettingsGroup title={t($ => $.settings.sections.notifications.groups.basic.title)}>
        <div className="flex flex-col gap-4">
          <Switch
            isSelected={isNotificationsEnabled}
            onChange={setIsNotificationsEnabled}
            className="w-full"
          >
            <Switch.Content className="flex w-full items-center justify-between">
              {t(
                $ =>
                  $.settings.sections.notifications.groups.basic.enableNotifications.switch.label,
              )}

              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Time Points */}
      <SettingsGroup title={t($ => $.settings.sections.notifications.groups.timePoints.title)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {notificationTimes.length > 0 && (
              <Toolbar
                orientation="horizontal"
                aria-label={t(
                  $ =>
                    $.settings.sections.notifications.groups.timePoints.notificationTime.label.text,
                )}
                className={`flex flex-wrap items-center gap-2 ${!isNotificationsEnabled ? 'pointer-events-none opacity-50' : ''}`}
              >
                {notificationTimes.map(timePoint => (
                  <Chip
                    key={timePoint.id}
                    variant="secondary"
                    className="hover:bg-secondary-200 h-9 max-w-full cursor-pointer rounded-full px-3 transition-transform select-none active:scale-95"
                    onClick={() => {
                      if (isNotificationsEnabled) {
                        setEditingNotificationTimeId(timePoint.id);
                      }
                    }}
                  >
                    <div className="flex max-w-full items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">
                        {formatDurationFull(timePoint.seconds, t)}
                      </span>

                      <CloseButton
                        className="h-5 w-5 min-w-0 shrink-0 opacity-70 transition-opacity hover:bg-danger-soft hover:text-danger-soft-foreground hover:opacity-100"
                        onClick={e => {
                          e.stopPropagation();
                          if (isNotificationsEnabled) {
                            removeNotificationTime(timePoint.id);
                          }
                        }}
                        aria-label={t(
                          $ =>
                            $.settings.sections.notifications.groups.timePoints
                              .removeNotificationTimeBtn.aria.label,
                        )}
                      />
                    </div>
                  </Chip>
                ))}
              </Toolbar>
            )}

            <Button
              size="sm"
              variant="ghost"
              isDisabled={!isNotificationsEnabled}
              onPress={() => setEditingNotificationTimeId(NEW_NOTIFICATION_TIME_ID)}
              className="hover:bg-default-100 h-9 rounded-full border-dashed px-4"
            >
              <FaPlus className="mr-1.5 h-3 w-3" />
              {t(
                $ =>
                  $.settings.sections.notifications.groups.timePoints.addNotificationTimeBtn.label,
              )}
            </Button>
          </div>
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Sound */}
      <SettingsGroup title={t($ => $.settings.sections.notifications.groups.sound.title)}>
        <div className="flex flex-col gap-4">
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

          <Select
            variant="secondary"
            value={notificationSoundType}
            isDisabled={!isNotificationsEnabled || !isNotificationSoundEnabled}
            placeholder={t(
              $ => $.settings.sections.notifications.groups.sound.soundType.select.label,
            )}
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
                    $ =>
                      $.settings.sections.notifications.groups.sound.soundType.select.options
                        .system,
                  )}
                >
                  {t(
                    $ =>
                      $.settings.sections.notifications.groups.sound.soundType.select.options
                        .system,
                  )}
                  <ListBox.ItemIndicator />
                </ListBox.Item>

                <ListBox.Item
                  id="app"
                  textValue={t(
                    $ =>
                      $.settings.sections.notifications.groups.sound.soundType.select.options.app,
                  )}
                >
                  {t(
                    $ =>
                      $.settings.sections.notifications.groups.sound.soundType.select.options.app,
                  )}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </SettingsGroup>

      {editingNotificationTime && (
        <NotificationTimeEditModal
          isOpen={Boolean(editingNotificationTimeId)}
          initialSeconds={editingNotificationTime.seconds}
          onOpenChange={open => !open && setEditingNotificationTimeId(null)}
          onSave={seconds => {
            if (editingNotificationTimeId === NEW_NOTIFICATION_TIME_ID) {
              addNotificationTime(seconds);
            } else {
              updateNotificationTime(editingNotificationTime.id, seconds);
            }
            setEditingNotificationTimeId(null);
          }}
        />
      )}
    </div>
  );
};
