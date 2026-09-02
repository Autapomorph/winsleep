import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const CustomTimerStepsSwitch = () => {
  const { t } = useTranslation();
  const { isCustomTimerStepsEnabled, setIsCustomTimerStepsEnabled } = useSettingsStore(
    useShallow(state => ({
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      setIsCustomTimerStepsEnabled: state.setIsCustomTimerStepsEnabled,
    })),
  );

  return (
    <Switch
      isSelected={isCustomTimerStepsEnabled}
      onChange={setIsCustomTimerStepsEnabled}
      className="w-full"
    >
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.timer.groups.customSteps.useCustomSteps.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
