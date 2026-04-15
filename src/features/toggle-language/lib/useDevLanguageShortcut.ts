import { useTranslation } from 'react-i18next';

import { config, SHORTCUTS, SUPPORTED_LOCALES } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

export const useDevLanguageShortcut = () => {
  const { i18n } = useTranslation();

  useAppHotkey(
    SHORTCUTS.DEV.TOGGLE_LANGUAGE,
    () => {
      const currentLocale = i18n.resolvedLanguage ?? 'en-US';
      const currentIndex = SUPPORTED_LOCALES.findIndex(locale => {
        return locale.key === currentLocale;
      });

      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % SUPPORTED_LOCALES.length;
      const nextLocale = SUPPORTED_LOCALES[nextIndex].key;

      i18n.changeLanguage(nextLocale);
    },
    {
      enabled: config.isDev,
    },
    [i18n],
  );
};
