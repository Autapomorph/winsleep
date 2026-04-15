import { defaultNS, ns, resources } from '@/shared/config/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources['en-US'];
    ns: typeof ns;
    defaultNS: typeof defaultNS;
    enableSelector: true;
  }
}
