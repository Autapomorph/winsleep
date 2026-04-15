import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { config } from './env';
import translationENUS from '../locales/en-US/translation.json';
import translationRURU from '../locales/ru-RU/translation.json';

export interface SupportedLocale {
  key: keyof typeof resources;
  originalName: string;
  englishName: string;
}

export const LOCAL_STORAGE_LOCALE_KEY = 'locale';

export const ns = ['translation'] as const;
export const defaultNS = 'translation' as const;

export const resources = {
  'en-US': { translation: translationENUS },
  'ru-RU': { translation: translationRURU },
} as const;

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { key: 'en-US', originalName: 'English', englishName: 'English' },
  { key: 'ru-RU', originalName: 'Русский', englishName: 'Russian' },
];

export const initializeI18n = () => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: config.isDev,

      ns,
      defaultNS,
      resources,

      fallbackLng: {
        default: ['en-US'],
        en: ['en-US'],
        ru: ['ru-RU'],
      },

      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LOCAL_STORAGE_LOCALE_KEY,
        caches: ['localStorage'],
      },

      interpolation: {
        escapeValue: false,
      },
    });
};
