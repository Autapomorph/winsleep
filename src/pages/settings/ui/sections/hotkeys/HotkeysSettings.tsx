import { useTranslation } from 'react-i18next';

import { config } from '@/shared/config';
import { HotkeyRow } from './HotkeyRow';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';

export const HotkeysSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.hotkeys.title)}
      </h2>

      {/* Group Timer Control */}
      <SettingsGroup title={t($ => $.settings.sections.hotkeys.groups.timer.title)}>
        <div className="flex flex-col gap-3">
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.startPauseResume)}
            keys={['Space']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.cancel)}
            keys={['Ctrl', 'Space']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.increase)}
            keys={['+']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.decrease)}
            keys={['-']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.instantExecute)}
            keys={['Ctrl', 'Shift', 'E']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.timer.lockSettings)}
            keys={['B']}
          />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Timer Actions */}
      <SettingsGroup title={t($ => $.settings.sections.hotkeys.groups.action.title)}>
        <div className="flex flex-col gap-3">
          <HotkeyRow label={t($ => $.settings.sections.hotkeys.groups.action.sleep)} keys={['S']} />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.action.hibernate)}
            keys={['H']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.action.shutdown)}
            keys={['P']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.action.reboot)}
            keys={['R']}
          />
          <HotkeyRow label={t($ => $.settings.sections.hotkeys.groups.action.lock)} keys={['L']} />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.action.signOut)}
            keys={['Q']}
          />
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Interface & Navigation */}
      <SettingsGroup title={t($ => $.settings.sections.hotkeys.groups.general.title)}>
        <div className="flex flex-col gap-3">
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.general.openSettings)}
            keys={['Ctrl', ',']}
          />
          <HotkeyRow
            label={t($ => $.settings.sections.hotkeys.groups.general.back)}
            keys={['Esc']}
          />
        </div>
      </SettingsGroup>

      {config.isDev && (
        <>
          <SettingsSeparator />

          {/* Group For Developers */}
          <SettingsGroup title={t($ => $.settings.sections.hotkeys.groups.dev.title)}>
            <div className="flex flex-col gap-3">
              <HotkeyRow
                label={t($ => $.settings.sections.hotkeys.groups.dev.toggleLanguage)}
                keys={['Alt', 'L']}
              />
              <HotkeyRow
                label={t($ => $.settings.sections.hotkeys.groups.dev.toggleTheme)}
                keys={['Alt', 'T']}
              />
              <HotkeyRow
                label={t($ => $.settings.sections.hotkeys.groups.dev.update)}
                keys={['Alt', 'U']}
              />
              <HotkeyRow
                label={t($ => $.settings.sections.hotkeys.groups.dev.crashTest)}
                keys={['Alt', 'E']}
              />
            </div>
          </SettingsGroup>
        </>
      )}
    </div>
  );
};
