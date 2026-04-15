import { useTranslation } from 'react-i18next';

import { AutostartSwitch } from './AutostartSwitch';
import { AutoUpdateSwitch } from './AutoUpdateSwitch';
import { ExportSettings } from './ExportSettings';
import { LanguageSelector } from './LanguageSelector';
import { OpenSettingsDir } from './OpenSettingsDir';
import { ResetSettings } from './ResetSettings';
import { StartMinimizedSwitch } from './StartMinimizedSwitch';
import { ThemeSelector } from './ThemeSelector';
import { TrayModeSwitch } from './TrayModeSwitch';
import { UpdateIntervalSelector } from './UpdateIntervalSelector';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';

export const GeneralSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.general.title)}
      </h2>

      {/* Group Language */}
      <SettingsGroup title={t($ => $.settings.sections.general.groups.language.title)}>
        <div className="flex flex-col gap-4">
          <LanguageSelector />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Appearance */}
      <SettingsGroup title={t($ => $.settings.sections.general.groups.appearance.title)}>
        <div className="flex flex-col gap-4">
          <ThemeSelector />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group System Settings */}
      <SettingsGroup title={t($ => $.settings.sections.general.groups.system.title)}>
        <div className="flex flex-col gap-4">
          <TrayModeSwitch />
          <AutostartSwitch />
          <StartMinimizedSwitch />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group App Updates */}
      <SettingsGroup title={t($ => $.settings.sections.general.groups.updates.title)}>
        <div className="flex flex-col gap-4">
          <AutoUpdateSwitch />
          <UpdateIntervalSelector />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Danger Zone */}
      <SettingsGroup title={t($ => $.settings.sections.general.groups.dangerZone.title)}>
        <div className="flex flex-row flex-wrap gap-4">
          <ExportSettings />
          <OpenSettingsDir />
          <ResetSettings />
        </div>
      </SettingsGroup>
    </div>
  );
};
