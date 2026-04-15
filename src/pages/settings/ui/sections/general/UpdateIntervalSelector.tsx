import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { type Key, Label, ListBox, Select } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { type UpdateInterval, UPDATE_INTERVALS } from '@/shared/config';

export const UpdateIntervalSelector = () => {
  const { t } = useTranslation();
  const { isAutoUpdateEnabled, updateInterval, setUpdateInterval } = useSettingsStore(
    useShallow(state => ({
      isAutoUpdateEnabled: state.isAutoUpdateEnabled,
      updateInterval: state.updateInterval,
      setUpdateInterval: state.setUpdateInterval,
    })),
  );

  const handleIntervalChange = (value: Key | null) => {
    if (value !== null) {
      const parsed = value === 'startup' ? 'startup' : Number(value);
      setUpdateInterval(parsed as UpdateInterval);
    }
  };

  return (
    <Select
      variant="secondary"
      value={updateInterval.toString()}
      isDisabled={!isAutoUpdateEnabled}
      placeholder={t(
        $ => $.settings.sections.general.groups.updates.autoCheck.intervalSelect.placeholder,
      )}
      onChange={handleIntervalChange}
    >
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.general.groups.updates.autoCheck.intervalSelect.label)}
      </Label>

      <Select.Trigger className="mt-1">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          {UPDATE_INTERVALS.map(interval => {
            const keyStr = interval.toString();
            const translationPath =
              interval === 'startup'
                ? t(
                    $ =>
                      $.settings.sections.general.groups.updates.autoCheck.intervalSelect.options
                        .startup,
                  )
                : t(
                    $ =>
                      $.settings.sections.general.groups.updates.autoCheck.intervalSelect.options
                        .hours,
                    { count: interval },
                  );

            return (
              <ListBox.Item key={keyStr} id={keyStr} textValue={translationPath}>
                {translationPath}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
