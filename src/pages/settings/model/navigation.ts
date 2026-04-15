import type { SelectorParam } from 'i18next';
import type { IconType } from 'react-icons';
import { FaBell, FaCircleInfo, FaGear, FaKeyboard, FaStopwatch, FaTerminal } from 'react-icons/fa6';
import { GiNightSleep } from 'react-icons/gi';

export interface SettingsSection {
  id: string;
  icon: IconType;
  getLabel: SelectorParam;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: 'action',
    icon: GiNightSleep,
    getLabel: $ => $.settings.sections.timerAction.title,
  },
  {
    id: 'timer',
    icon: FaStopwatch,
    getLabel: $ => $.settings.sections.timer.title,
  },
  {
    id: 'notifications',
    icon: FaBell,
    getLabel: $ => $.settings.sections.notifications.title,
  },
  {
    id: 'general',
    icon: FaGear,
    getLabel: $ => $.settings.sections.general.title,
  },
  {
    id: 'hotkeys',
    icon: FaKeyboard,
    getLabel: $ => $.settings.sections.hotkeys.title,
  },
  {
    id: 'debug',
    icon: FaTerminal,
    getLabel: $ => $.settings.sections.debug.title,
  },
  {
    id: 'about',
    icon: FaCircleInfo,
    getLabel: $ => $.settings.sections.about.title,
  },
] as const;
