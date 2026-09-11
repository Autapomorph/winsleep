import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const PreventDisplaySleepSwitch = () => {
  const { t } = useTranslation();
  const {
    isPreventPCSleepDuringTimerEnabled,
    isPreventDisplaySleepDuringTimerEnabled,
    setIsPreventDisplaySleepDuringTimerEnabled,
  } = useSettingsStore(
    useShallow(state => ({
      isPreventPCSleepDuringTimerEnabled: state.isPreventPCSleepDuringTimerEnabled,
      isPreventDisplaySleepDuringTimerEnabled: state.isPreventDisplaySleepDuringTimerEnabled,
      setIsPreventDisplaySleepDuringTimerEnabled: state.setIsPreventDisplaySleepDuringTimerEnabled,
    })),
  );

  return (
    <Switch
      className="w-full"
      isSelected={isPreventDisplaySleepDuringTimerEnabled}
      isDisabled={!isPreventPCSleepDuringTimerEnabled}
      onChange={setIsPreventDisplaySleepDuringTimerEnabled}
    >
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t(
              $ =>
                $.settings.sections.timer.groups.basic.preventDisplaySleepDuringTimer.switch.label,
            )}
          </span>

          <InfoTooltip className="break-normal whitespace-normal">
            {t(
              $ =>
                $.settings.sections.timer.groups.basic.preventDisplaySleepDuringTimer.tooltip.text,
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
