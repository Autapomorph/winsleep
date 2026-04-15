import {
  type ThemeProviderProps as NextThemesProviderProps,
  ThemeProvider as NextThemesProvider,
} from 'next-themes';

import { DEFAULT_THEME, THEMES } from '@/shared/config';

type ThemeProviderProps = React.PropsWithChildren & Omit<NextThemesProviderProps, 'children'>;

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={[...THEMES]}
      defaultTheme={DEFAULT_THEME}
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
};
