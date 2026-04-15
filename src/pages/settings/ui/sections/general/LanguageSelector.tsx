import { useTranslation } from 'react-i18next';
import { type Key, Label, ListBox, Select } from '@heroui/react';

import { SUPPORTED_LOCALES } from '@/shared/config';

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

  const currentLocale = i18n.resolvedLanguage;
  const sortedLocales = SUPPORTED_LOCALES.toSorted((a, b) =>
    a.englishName.localeCompare(b.englishName),
  );

  const handleLanguageChange = (value: Key | null) => {
    if (value !== null) {
      i18n.changeLanguage(value as string);
    }
  };

  return (
    <Select
      variant="secondary"
      value={currentLocale}
      placeholder={t($ => $.settings.sections.general.groups.language.language.select.placeholder)}
      onChange={handleLanguageChange}
    >
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.general.groups.language.language.select.label)}
      </Label>

      <Select.Trigger className="mt-1">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          {sortedLocales.map(locale => (
            <ListBox.Item key={locale.key} id={locale.key} textValue={locale.originalName}>
              {locale.originalName}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
