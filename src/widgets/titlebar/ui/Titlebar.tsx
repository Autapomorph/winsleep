import { useTranslation } from 'react-i18next';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from 'react-icons/vsc';

import Logo from '@/assets/logo_full.svg?react';
import { UpdateButton } from '@/features/check-updates';
import { windowClose, windowMinimize } from '@/shared/api';
import { Menu } from './menu/Menu';
import { TitlebarButton } from './TitlebarButton';

export const Titlebar = () => {
  const { t } = useTranslation();

  return (
    <header
      className="relative flex h-titlebar items-center justify-between bg-background"
      data-tauri-drag-region
    >
      <div className="pointer-events-none pl-2.5">
        <Logo className="w-25" />
      </div>

      <div className="flex items-center justify-center" data-tauri-no-drag>
        <UpdateButton ButtonComponent={TitlebarButton} />

        <Menu />

        <TitlebarButton
          onPress={windowMinimize}
          aria-label={t($ => $.titlebar.minimizeBtn.aria.label)}
        >
          <VscChromeMinimize fontSize={20} />
        </TitlebarButton>

        <TitlebarButton isDisabled aria-label={t($ => $.titlebar.maximizeBtn.aria.label)}>
          <VscChromeMaximize fontSize={20} />
        </TitlebarButton>

        <TitlebarButton
          className="hover:bg-danger-hover"
          onPress={windowClose}
          aria-label={t($ => $.titlebar.closeBtn.aria.label)}
        >
          <VscChromeClose fontSize={20} />
        </TitlebarButton>
      </div>
    </header>
  );
};
