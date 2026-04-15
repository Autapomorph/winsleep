import type { DependencyList } from 'react';
import { type HotkeyCallback, type Keys, type Options, useHotkeys } from 'react-hotkeys-hook';

import { type HotkeyConfig } from '@/shared/config';

const isHotkeyConfig = (shortcut: HotkeyConfig | Keys): shortcut is HotkeyConfig => {
  return (
    typeof shortcut === 'object' &&
    shortcut !== null &&
    !Array.isArray(shortcut) &&
    'keys' in shortcut
  );
};

export const useAppHotkey = (
  shortcut: HotkeyConfig | Keys,
  callback: HotkeyCallback,
  options?: Options,
  dependencies?: DependencyList,
) => {
  const keys = isHotkeyConfig(shortcut) ? shortcut.keys : shortcut;
  const scopes = isHotkeyConfig(shortcut) ? shortcut.scopes : undefined;

  useHotkeys(
    keys,
    callback,
    {
      scopes,
      preventDefault: true,
      ...options,
    },
    dependencies,
  );
};
