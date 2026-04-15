import { useTheme } from 'next-themes';

import { type Theme, config, SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

const CYCLE_THEMES: Theme[] = ['system', 'dark', 'light'];

export const useDevThemeShortcut = () => {
  const { theme, setTheme } = useTheme();

  useAppHotkey(
    SHORTCUTS.DEV.TOGGLE_THEME,
    () => {
      const currentIndex = CYCLE_THEMES.indexOf((theme ?? 'system') as Theme);
      const nextIndex = (currentIndex + 1) % CYCLE_THEMES.length;
      setTheme(CYCLE_THEMES[nextIndex]);
    },
    {
      enabled: config.isDev,
    },
    [theme, setTheme],
  );
};
