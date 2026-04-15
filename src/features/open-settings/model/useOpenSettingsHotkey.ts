import { useNavigate } from 'react-router';

import { SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

export const useOpenSettingsHotkey = () => {
  const navigate = useNavigate();

  useAppHotkey(SHORTCUTS.SETTINGS.OPEN, () => {
    navigate('/settings');
  });
};
