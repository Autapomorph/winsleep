import { type TimerAction, SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

interface Params {
  onActionChange: (action: TimerAction) => void;
  isLocked?: boolean;
}

export const useTimerActionHotkeys = ({ onActionChange, isLocked = false }: Params) => {
  useAppHotkey(SHORTCUTS.ACTION.SLEEP, () => onActionChange('sleep'), {
    enabled: !isLocked,
  });

  useAppHotkey(SHORTCUTS.ACTION.HIBERNATE, () => onActionChange('hibernate'), {
    enabled: !isLocked,
  });

  useAppHotkey(SHORTCUTS.ACTION.SHUTDOWN, () => onActionChange('shutdown'), {
    enabled: !isLocked,
  });

  useAppHotkey(SHORTCUTS.ACTION.REBOOT, () => onActionChange('reboot'), {
    enabled: !isLocked,
  });

  useAppHotkey(SHORTCUTS.ACTION.LOCK, () => onActionChange('lock'), {
    enabled: !isLocked,
  });

  useAppHotkey(SHORTCUTS.ACTION.SIGN_OUT, () => onActionChange('signout'), {
    enabled: !isLocked,
  });
};
