import { useTranslation } from 'react-i18next';

import { useDebugLogs } from '@/entities/log';
import { LogActions } from './LogActions';
import { LogViewer } from './LogViewer';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';

export const DebugSettings = () => {
  const { t } = useTranslation();

  useDebugLogs();

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.debug.title)}
      </h2>

      {/* Logs View Group */}
      <SettingsGroup title={t($ => $.settings.sections.debug.groups.logs.title)}>
        <LogViewer />
      </SettingsGroup>

      <SettingsSeparator />

      {/* Control Actions Group */}
      <SettingsGroup title={t($ => $.settings.sections.debug.groups.actions.title)}>
        <LogActions />
      </SettingsGroup>
    </div>
  );
};
