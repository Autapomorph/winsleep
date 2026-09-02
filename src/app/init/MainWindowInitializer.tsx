import { useAutoInstallOnExit, useAutoUpdater, useMockUpdater } from '@/features/check-updates';
import {
  usePowerSystemEvents,
  useScheduledTimerRestore,
  useScheduledTimerStateSync,
  useTimerNotification,
} from '@/features/manage-timer';
import { useTrayMode } from '@/features/system-tray';
import { useDevLanguageShortcut } from '@/features/toggle-language';
import { useDevThemeShortcut } from '@/features/toggle-theme';
import { useAppReady } from './useAppReady';
import { useAppShortcuts } from './useAppShortcuts';

export const MainWindowInitializer = () => {
  useAppShortcuts();
  useDevThemeShortcut();
  useDevLanguageShortcut();
  usePowerSystemEvents();
  useTimerNotification();
  useScheduledTimerStateSync();
  useScheduledTimerRestore();
  useTrayMode();
  useAutoUpdater();
  useMockUpdater();
  useAutoInstallOnExit();
  useAppReady();

  return null;
};
