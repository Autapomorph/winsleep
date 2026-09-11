import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const PreventPCSleepSwitch = () => {
  const { t } = useTranslation();
  const { isPreventPCSleepDuringTimerEnabled, setIsPreventPCSleepDuringTimerEnabled } =
    useSettingsStore(
      useShallow(state => ({
        isPreventPCSleepDuringTimerEnabled: state.isPreventPCSleepDuringTimerEnabled,
        setIsPreventPCSleepDuringTimerEnabled: state.setIsPreventPCSleepDuringTimerEnabled,
      })),
    );

  return (
    <Switch
      className="w-full"
      isSelected={isPreventPCSleepDuringTimerEnabled}
      onChange={setIsPreventPCSleepDuringTimerEnabled}
    >
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t($ => $.settings.sections.timer.groups.basic.preventPCSleepDuringTimer.switch.label)}
          </span>

          <InfoTooltip className="break-normal whitespace-normal">
            {t($ => $.settings.sections.timer.groups.basic.preventPCSleepDuringTimer.tooltip.text)}
          </InfoTooltip>
        </div>

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
