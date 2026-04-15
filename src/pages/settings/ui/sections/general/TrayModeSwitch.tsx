import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const TrayModeSwitch = () => {
  const { t } = useTranslation();
  const { isTrayModeEnabled, setIsTrayModeEnabled } = useSettingsStore(
    useShallow(state => ({
      isTrayModeEnabled: state.isTrayModeEnabled,
      setIsTrayModeEnabled: state.setIsTrayModeEnabled,
    })),
  );

  return (
    <Switch className="w-full" isSelected={isTrayModeEnabled} onChange={setIsTrayModeEnabled}>
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.general.groups.system.trayMode.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
