import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';

export const LockByDefaultSwitch = () => {
  const { t } = useTranslation();
  const { isLockedByDefault, setIsLockedByDefault } = useSettingsStore(
    useShallow(state => ({
      isLockedByDefault: state.isLockedByDefault,
      setIsLockedByDefault: state.setIsLockedByDefault,
    })),
  );

  return (
    <Switch isSelected={isLockedByDefault} onChange={setIsLockedByDefault} className="w-full">
      <Switch.Content className="flex w-full items-center justify-between">
        {t($ => $.settings.sections.timer.groups.security.lockByDefault.switch.label)}

        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
};
