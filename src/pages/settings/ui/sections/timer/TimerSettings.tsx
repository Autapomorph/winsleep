import { useTranslation } from 'react-i18next';

import { DefaultTimerSetting } from './basic/DefaultTimerSetting';
import { RememberConfiguredTimeSwitch } from './basic/RememberConfiguredTimeSwitch';
import { RestoreScheduledTimerSwitch } from './basic/RestoreScheduledTimerSwitch';
import { CustomTimerStepsSwitch } from './custom-steps/CustomTimerStepsSwitch';
import { StepDecreaseSetting } from './custom-steps/StepDecreaseSetting';
import { StepIncreaseSetting } from './custom-steps/StepIncreaseSetting';
import { CustomTimerPresetsSetting } from './presets/CustomTimerPresetsSetting';
import { LockByDefaultSwitch } from './security/LockByDefaultSwitch';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';

export const TimerSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.timer.title)}
      </h2>

      {/* Group Basic */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.basic.title)}>
        <div className="flex flex-col gap-4">
          <RememberConfiguredTimeSwitch />
          <RestoreScheduledTimerSwitch />
          <DefaultTimerSetting />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Security */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.security.title)}>
        <div className="flex flex-col gap-4">
          <LockByDefaultSwitch />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Custom Steps */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.customSteps.title)}>
        <div className="flex flex-col gap-4">
          <CustomTimerStepsSwitch />
          <StepDecreaseSetting />
          <StepIncreaseSetting />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Presets */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.presets.title)}>
        <div className="flex flex-col gap-4">
          <CustomTimerPresetsSetting />
        </div>
      </SettingsGroup>
    </div>
  );
};
