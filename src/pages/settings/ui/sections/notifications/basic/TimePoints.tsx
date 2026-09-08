import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Chip, CloseButton, Toolbar } from '@heroui/react';
import { FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import { formatDurationFull } from '@/shared/lib';

interface Props {
  addNewTimePoint: () => void;
  editTimePoint: (id: string) => void;
}

export const TimePoints = ({ addNewTimePoint, editTimePoint }: Props) => {
  const { t } = useTranslation();
  const { isNotificationsEnabled, notificationTimes, removeNotificationTime } = useSettingsStore(
    useShallow(state => ({
      isNotificationsEnabled: state.isNotificationsEnabled,
      notificationTimes: state.notificationTimes,
      removeNotificationTime: state.removeNotificationTime,
    })),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {notificationTimes.length > 0 && (
        <Toolbar
          orientation="horizontal"
          className={`flex flex-wrap items-center gap-2 ${!isNotificationsEnabled ? 'pointer-events-none opacity-50' : ''}`}
          aria-label={t(
            $ =>
              $.settings.sections.notifications.groups.basic.timePoints.notificationTime.label.text,
          )}
        >
          {notificationTimes.map(timePoint => (
            <Chip
              key={timePoint.id}
              variant="secondary"
              className="hover:bg-secondary-200 h-9 max-w-full cursor-pointer rounded-full px-3 transition-transform select-none active:scale-95"
              onClick={() => editTimePoint(timePoint.id)}
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
                      $.settings.sections.notifications.groups.basic.timePoints
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
        className="hover:bg-default-100 h-9 rounded-full border-dashed px-4"
        onPress={addNewTimePoint}
      >
        <FaPlus className="mr-1.5 h-3 w-3" />
        {t(
          $ =>
            $.settings.sections.notifications.groups.basic.timePoints.addNotificationTimeBtn.label,
        )}
      </Button>
    </div>
  );
};
