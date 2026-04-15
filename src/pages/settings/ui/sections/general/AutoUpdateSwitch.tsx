import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const AutoUpdateSwitch = () => {
  const { t } = useTranslation();
  const { isAutoUpdateEnabled, setIsAutoUpdateEnabled } = useSettingsStore(
    useShallow(state => ({
      isAutoUpdateEnabled: state.isAutoUpdateEnabled,
      setIsAutoUpdateEnabled: state.setIsAutoUpdateEnabled,
    })),
  );

  return (
    <Switch className="w-full" isSelected={isAutoUpdateEnabled} onChange={setIsAutoUpdateEnabled}>
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.general.groups.updates.autoCheck.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
