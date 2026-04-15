import type { Options } from 'react-hotkeys-hook';

import { config, SHORTCUTS } from '@/shared/config';
import { noop, useAppHotkey } from '@/shared/lib';

export const useAppShortcuts = () => {
  const isProd = !config.isDev;

  // Custom Reload Shortcut (always enabled)
  useAppHotkey(
    SHORTCUTS.WEBVIEW.RELOAD_CUSTOM,
    () => {
      window.location.reload();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Hardening Shortcuts (only in production)
  const hardeningShortcutsOptions: Options = {
    enabled: isProd,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  };

  useAppHotkey(SHORTCUTS.WEBVIEW.RELOAD, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.DEV_TOOLS, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.OPEN, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.PRINT, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.FIND, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.HISTORY, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.DOWNLOADS, noop, hardeningShortcutsOptions);
  useAppHotkey(SHORTCUTS.WEBVIEW.CARET_BROWSING, noop, hardeningShortcutsOptions);
};
