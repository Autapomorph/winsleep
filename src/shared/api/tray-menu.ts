import type { TimerAction } from '../config';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SetIsTrayModeEnabledCommandArgs = {
  isEnabled: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TrayMenuState = {
  tooltip: string;
  openLabel: string;
  quitLabel: string;
  timerState: 'idle' | 'paused' | 'running';
  timerMode: 'duration' | 'timestamp' | 'indefinite';
  isExpiring: boolean;
  timerAction: {
    selectedTimerActionLabel: string;
    selectedTimerAction: TimerAction;
    sleepLabel: string;
    hibernateLabel: string;
    shutdownLabel: string;
    rebootLabel: string;
    lockLabel: string;
    signoutLabel: string;
    keepAwakeLabel: string;
  };
  timerStatusLabel: string;
  startResumePauseTimerLabel: string;
  cancelTimerLabel: string;
  timerIncreaseLabel: string;
  timerDecreaseLabel: string;
  presetsLabel: string;
  isSettingsLocked: boolean;
  timerPresets: {
    seconds: number;
    label: string;
  }[];
  lockSettingsLabel: string;
  updateLabel: string;
  updateStatus:
    'idle' | 'checking' | 'available' | 'downloading' | 'readyToInstall' | 'error' | 'upToDate';
};
