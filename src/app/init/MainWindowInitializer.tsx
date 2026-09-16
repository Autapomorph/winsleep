import { useAutoInstallOnExit, useAutoUpdater, useMockUpdater } from '@/features/check-updates';
import { useKeepAwakeTimerSync } from '@/features/keep-awake';
import {
  usePowerSystemEvents,
  useScheduledTimerRestore,
  useScheduledTimerStateSync,
  useTimerCompletionListener,
  useTimerNotification,
} from '@/features/manage-timer';
import { useTrayMode } from '@/features/system-tray';
import { useDevLanguageShortcut } from '@/features/toggle-language';
import { useDevThemeShortcut } from '@/features/toggle-theme';
import { useTimerListeners } from '@/entities/timer';
import { useTabUnsuspend } from '@/shared/lib';
import { useAppReady } from './useAppReady';
import { useAppShortcuts } from './useAppShortcuts';

export const MainWindowInitializer = () => {
  useTabUnsuspend();
  useTimerListeners();
  useAppShortcuts();
  useDevThemeShortcut();
  useDevLanguageShortcut();
  usePowerSystemEvents();
  useKeepAwakeTimerSync();
  useTimerNotification();
  useTimerCompletionListener();
  useScheduledTimerRestore();
  useScheduledTimerStateSync();
  useTrayMode();
  useAutoUpdater();
  useMockUpdater();
  useAutoInstallOnExit();
  useAppReady();

  return null;
};
