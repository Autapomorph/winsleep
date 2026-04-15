import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { type Key, Label, ListBox, Select } from '@heroui/react';

export const ThemeSelector = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: Key | null) => {
    if (value !== null) {
      setTheme(value as string);
    }
  };

  return (
    <Select
      variant="secondary"
      value={theme}
      placeholder={t($ => $.settings.sections.general.groups.appearance.theme.select.placeholder)}
      onChange={handleThemeChange}
    >
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.general.groups.appearance.theme.select.label)}
      </Label>

      <Select.Trigger className="mt-1">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          <ListBox.Item
            id="light"
            textValue={t(
              $ => $.settings.sections.general.groups.appearance.theme.select.options.light,
            )}
          >
            {t($ => $.settings.sections.general.groups.appearance.theme.select.options.light)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item
            id="dark"
            textValue={t(
              $ => $.settings.sections.general.groups.appearance.theme.select.options.dark,
            )}
          >
            {t($ => $.settings.sections.general.groups.appearance.theme.select.options.dark)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item
            id="system"
            textValue={t(
              $ => $.settings.sections.general.groups.appearance.theme.select.options.system,
            )}
          >
            {t($ => $.settings.sections.general.groups.appearance.theme.select.options.system)}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
