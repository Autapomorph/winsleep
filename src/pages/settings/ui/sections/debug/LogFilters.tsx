import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';

import { type LogLevelFilter, useDebugLogsStore } from '@/entities/log';
import { config } from '@/shared/config';

const filterLevelLabelKeys = {
  ALL: 'all',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
} as const;

export const LogFilters = () => {
  const { t } = useTranslation();
  const { selectedLevel, setSelectedLevel } = useDebugLogsStore(
    useShallow(state => ({
      selectedLevel: state.selectedLevel,
      setSelectedLevel: state.setSelectedLevel,
    })),
  );

  const filterLevels = useMemo(() => {
    const baseLevels = ['ALL', 'INFO', 'WARN', 'ERROR'] as const;
    return config.isDev ? ([...baseLevels, 'DEBUG'] as const) : baseLevels;
  }, []);

  const handleLevelChange = (lvl: LogLevelFilter) => {
    setSelectedLevel(lvl);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filterLevels.map(level => (
        <Button
          key={level}
          size="sm"
          variant={selectedLevel === level ? 'primary' : 'secondary'}
          onPress={() => handleLevelChange(level)}
        >
          {t($ => $.settings.sections.debug.groups.logs.filter[filterLevelLabelKeys[level]])}
        </Button>
      ))}
    </div>
  );
};
