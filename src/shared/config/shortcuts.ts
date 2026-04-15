import { type Keys } from 'react-hotkeys-hook';

export interface HotkeyConfig {
  keys: Keys;
  scopes?: string | string[];
}

type ShortcutLeaf = HotkeyConfig | Keys;

type ShortcutTree = {
  [key: string]: ShortcutLeaf | ShortcutTree;
} & {
  keys?: never;
};

export const SHORTCUT_SCOPES = {
  GLOBAL: 'global',
  TIMER: 'timer',
  SETTINGS: 'settings',
} as const;

export const SHORTCUTS = {
  TIMER: {
    START_PAUSE_RESUME: {
      keys: ['space'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    CANCEL: {
      keys: ['ctrl+space'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    INCREASE: {
      keys: ['+', '=', 'Add', 'equal'],
      scopes: [SHORTCUT_SCOPES.TIMER],
    },
    DECREASE: {
      keys: ['-', 'Subtract', 'minus'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    INSTANT_EXECUTE: {
      keys: ['ctrl+shift+e'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    LOCK_SETTINGS: {
      keys: ['b'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
  },
  ACTION: {
    SLEEP: {
      keys: ['s'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    HIBERNATE: {
      keys: ['h'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    SHUTDOWN: {
      keys: ['p'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    REBOOT: {
      keys: ['r'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    LOCK: {
      keys: ['l'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
    SIGN_OUT: {
      keys: ['q'],
      scopes: SHORTCUT_SCOPES.TIMER,
    },
  },
  DEV: {
    TOGGLE_THEME: {
      keys: ['alt+t'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    TOGGLE_LANGUAGE: {
      keys: ['alt+l'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    UPDATE: {
      keys: ['alt+u'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    CRASH_TEST: {
      keys: ['alt+e'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
  },
  SETTINGS: {
    OPEN: {
      keys: ['ctrl+comma'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    BACK: {
      keys: ['Escape'],
      scopes: SHORTCUT_SCOPES.SETTINGS,
    },
  },
  // Default WebView shortcuts
  WEBVIEW: {
    RELOAD: {
      keys: ['mod+r', 'mod+shift+r', 'f5', 'mod+f5', 'mod+shift+f5'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    RELOAD_CUSTOM: {
      keys: ['mod+shift+alt+r'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    DEV_TOOLS: {
      keys: ['f12', 'mod+shift+i', 'mod+u'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    OPEN: {
      keys: ['mod+o'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    PRINT: {
      keys: ['mod+p', 'mod+shift+p'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    FIND: {
      keys: ['f3', 'mod+f', 'mod+g', 'mod+shift+g'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    HISTORY: {
      keys: ['mod+h'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    DOWNLOADS: {
      keys: ['mod+j'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
    CARET_BROWSING: {
      keys: ['f7'],
      scopes: SHORTCUT_SCOPES.GLOBAL,
    },
  },
} satisfies ShortcutTree;
