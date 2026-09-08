import { useTranslation } from 'react-i18next';

import { DefaultActionSelector } from './basic/DefaultActionSelector';
import { ForceActionSwitch } from './basic/ForceActionSwitch';
import { RememberSelectedActionSwitch } from './basic/RememberSelectedActionSwitch';
import { SettingsGroup } from '../../layout/SettingsGroup';

export const TimerActionSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.timerAction.title)}
      </h2>

      {/* Group Basic */}
      <SettingsGroup title={t($ => $.settings.sections.timerAction.groups.basic.title)}>
        <div className="flex flex-col gap-4">
          <RememberSelectedActionSwitch />
          <DefaultActionSelector />
          <ForceActionSwitch />
        </div>
      </SettingsGroup>
    </div>
  );
};
