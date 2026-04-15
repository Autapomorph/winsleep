import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const AutostartSwitch = () => {
  const { t } = useTranslation();
  const { isAutostartEnabled, setIsAutostartEnabled } = useSettingsStore(
    useShallow(state => ({
      isAutostartEnabled: state.isAutostartEnabled,
      setIsAutostartEnabled: state.setIsAutostartEnabled,
    })),
  );

  return (
    <Switch className="w-full" isSelected={isAutostartEnabled} onChange={setIsAutostartEnabled}>
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.general.groups.system.autostart.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
