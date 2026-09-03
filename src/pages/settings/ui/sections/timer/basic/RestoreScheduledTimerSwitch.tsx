import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const RestoreScheduledTimerSwitch = () => {
  const { t } = useTranslation();
  const { isRestoreScheduledTimerOnStartupEnabled, setIsRestoreScheduledTimerOnStartupEnabled } =
    useSettingsStore(
      useShallow(state => ({
        isRestoreScheduledTimerOnStartupEnabled: state.isRestoreScheduledTimerOnStartupEnabled,
        setIsRestoreScheduledTimerOnStartupEnabled:
          state.setIsRestoreScheduledTimerOnStartupEnabled,
      })),
    );

  return (
    <Switch
      className="w-full"
      isSelected={isRestoreScheduledTimerOnStartupEnabled}
      onChange={setIsRestoreScheduledTimerOnStartupEnabled}
    >
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t(
              $ =>
                $.settings.sections.timer.groups.basic.restoreScheduledTimerOnStartup.switch.label,
            )}
          </span>

          <InfoTooltip className="break-normal whitespace-normal">
            {t(
              $ =>
                $.settings.sections.timer.groups.basic.restoreScheduledTimerOnStartup.tooltip.text,
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
