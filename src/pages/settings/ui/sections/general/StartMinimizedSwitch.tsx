import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const StartMinimizedSwitch = () => {
  const { t } = useTranslation();
  const { isStartMinimizedEnabled, setIsStartMinimizedEnabled, isAutostartEnabled } =
    useSettingsStore(
      useShallow(state => ({
        isStartMinimizedEnabled: state.isStartMinimizedEnabled,
        setIsStartMinimizedEnabled: state.setIsStartMinimizedEnabled,
        isAutostartEnabled: state.isAutostartEnabled,
      })),
    );

  return (
    <Switch
      className="w-full"
      isSelected={isStartMinimizedEnabled}
      isDisabled={!isAutostartEnabled}
      onChange={setIsStartMinimizedEnabled}
    >
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.general.groups.system.startMinimized.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
