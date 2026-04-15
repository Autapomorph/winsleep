import { UnheadProvider } from '@unhead/react/client';
import { useTranslation } from 'react-i18next';
import { I18nProvider, Toast } from '@heroui/react';
import { HotkeysProvider } from 'react-hotkeys-hook';

import { head } from '@/app/meta';
import { SHORTCUT_SCOPES } from '@/shared/config';
import { ThemeProvider } from './ThemeProvider';

type Props = React.PropsWithChildren;

export const Providers = ({ children }: Props) => {
  const { i18n } = useTranslation();

  return (
    <UnheadProvider head={head}>
      <I18nProvider locale={i18n.language}>
        <ThemeProvider>
          <HotkeysProvider initiallyActiveScopes={[SHORTCUT_SCOPES.GLOBAL]}>
            <Toast.Provider />
            {children}
          </HotkeysProvider>
        </ThemeProvider>
      </I18nProvider>
    </UnheadProvider>
  );
};
