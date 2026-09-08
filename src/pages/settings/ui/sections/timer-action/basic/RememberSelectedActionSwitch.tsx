import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const RememberSelectedActionSwitch = () => {
  const { t } = useTranslation();
  const { shouldRememberSelectedTimerAction, setShouldRememberSelectedTimerAction } =
    useSettingsStore(
      useShallow(state => ({
        shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
        setShouldRememberSelectedTimerAction: state.setShouldRememberSelectedTimerAction,
      })),
    );

  return (
    <Switch
      className="w-full"
      isSelected={shouldRememberSelectedTimerAction}
      onChange={setShouldRememberSelectedTimerAction}
    >
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t(
              $ =>
                $.settings.sections.timerAction.groups.basic.rememberSelectedTimerAction.switch
                  .label,
            )}
          </span>

          <InfoTooltip className="break-normal whitespace-normal">
            {t(
              $ =>
                $.settings.sections.timerAction.groups.basic.rememberSelectedTimerAction.tooltip
                  .text,
            )}
          </InfoTooltip>
        </div>

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
