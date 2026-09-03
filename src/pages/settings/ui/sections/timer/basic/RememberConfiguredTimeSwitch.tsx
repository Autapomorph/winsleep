import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const RememberConfiguredTimeSwitch = () => {
  const { t } = useTranslation();
  const { shouldRememberConfiguredTime, setShouldRememberConfiguredTime } = useSettingsStore(
    useShallow(state => ({
      shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
      setShouldRememberConfiguredTime: state.setShouldRememberConfiguredTime,
    })),
  );

  return (
    <Switch
      isSelected={shouldRememberConfiguredTime}
      onChange={setShouldRememberConfiguredTime}
      className="w-full"
    >
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t($ => $.settings.sections.timer.groups.basic.rememberConfiguredTime.switch.label)}
          </span>

          <InfoTooltip className="break-normal whitespace-normal">
            {t($ => $.settings.sections.timer.groups.basic.rememberConfiguredTime.tooltip.text)}
          </InfoTooltip>
        </div>

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
