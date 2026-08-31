import type { TimerAction } from '@/shared/config';
import type { TrayMenuState } from './tray-menu';

export interface Events {
  'app-ready': never;
  'app-exit-requested': never;
  'window-closed-to-tray': never;
  'timer-tick': number;
  'timer-complete': never;
  'tray-sync-request': never;
  'tray-timer-action-selected': TimerAction;
  'tray-timer-start-resume-pause-clicked': never;
  'tray-timer-cancel-clicked': never;
  'tray-preset-selected': number;
  'tray-timer-increase-clicked': never;
  'tray-timer-decrease-clicked': never;
  'tray-settings-lock-toggle-clicked': never;
  'tray-update-clicked': never;
  'tray-state-updated': TrayMenuState;
  'settings-external-change': never;
  'system-resume': never;
}
