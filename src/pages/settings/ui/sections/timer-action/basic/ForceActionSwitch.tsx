import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { InfoTooltip } from '@/shared/ui';

export const ForceActionSwitch = () => {
  const { t } = useTranslation();
  const { isForceActionEnabled, setIsForceActionEnabled } = useSettingsStore(
    useShallow(state => ({
      isForceActionEnabled: state.isForceActionEnabled,
      setIsForceActionEnabled: state.setIsForceActionEnabled,
    })),
  );

  return (
    <Switch className="w-full" isSelected={isForceActionEnabled} onChange={setIsForceActionEnabled}>
      <Switch.Content className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>
            {t($ => $.settings.sections.timerAction.groups.basic.forceAction.switch.label)}
          </span>

          <InfoTooltip className="max-w-xs break-normal whitespace-normal">
            {t($ => $.settings.sections.timerAction.groups.basic.forceAction.tooltip.text)}
          </InfoTooltip>
        </div>

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
