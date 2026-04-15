import { useUpdateStore } from '@/entities/updater';
import { config, SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

export const useMockUpdater = () => {
  const triggerMockUpdate = useUpdateStore(state => state.triggerMockUpdate);

  useAppHotkey(
    SHORTCUTS.DEV.UPDATE,
    () => {
      triggerMockUpdate().catch(() => {});
    },
    {
      enabled: config.isDev,
    },
  );
};
