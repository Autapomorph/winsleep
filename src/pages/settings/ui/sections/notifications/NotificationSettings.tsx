import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_NOTIFICATION_SECONDS } from '@/shared/config';
import { IsNotificationEnabledSwitch } from './basic/IsNotificationEnabledSwitch';
import { TimePoints } from './basic/TimePoints';
import { IsNotificationSoundEnabledSwitch } from './sound/IsNotificationSoundEnabledSwitch';
import { NotificationSoundSelector } from './sound/NotificationSoundSelector';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';
import { NotificationTimeEditModal } from '../../modals/NotificationTimeEditModal';

export const NotificationSettings = () => {
  const { t } = useTranslation();
  const [editingNotificationTimeId, setEditingNotificationTimeId] = useState<string | null>(null);

  const { isNotificationsEnabled, notificationTimes, addNotificationTime, updateNotificationTime } =
    useSettingsStore(
      useShallow(state => ({
        isNotificationsEnabled: state.isNotificationsEnabled,
        notificationTimes: state.notificationTimes,
        addNotificationTime: state.addNotificationTime,
        updateNotificationTime: state.updateNotificationTime,
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
          <IsNotificationEnabledSwitch />

          <TimePoints
            addNewTimePoint={() => {
              setEditingNotificationTimeId(NEW_NOTIFICATION_TIME_ID);
            }}
            editTimePoint={timePointId => {
              if (isNotificationsEnabled) {
                setEditingNotificationTimeId(timePointId);
              }
            }}
          />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Sound */}
      <SettingsGroup title={t($ => $.settings.sections.notifications.groups.sound.title)}>
        <div className="flex flex-col gap-4">
          <IsNotificationSoundEnabledSwitch />
          <NotificationSoundSelector />
        </div>
      </SettingsGroup>

      {/* Notification time edit modal */}
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
