import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Dropdown, Label } from '@heroui/react';
import { TbDownload } from 'react-icons/tb';

import { useUpdater, useUpdateStore } from '@/entities/updater';

export const CheckUpdates = () => {
  const { t } = useTranslation();
  const update = useUpdater();
  const { status, downloadProgress } = useUpdateStore(
    useShallow(state => ({
      status: state.status,
      downloadProgress: state.downloadProgress,
    })),
  );

  const handleAction = () => {
    update().catch(() => {});
  };

  const getUpdateText = () => {
    switch (status) {
      case 'checking':
        return t($ => $.titlebar.menu.items.checkUpdates.checking);
      case 'available':
        return t($ => $.titlebar.menu.items.checkUpdates.available);
      case 'downloading':
        return t($ => $.titlebar.menu.items.checkUpdates.downloading, {
          progress: downloadProgress,
        });
      case 'readyToRestart':
        return t($ => $.titlebar.menu.items.checkUpdates.readyToRestart);
      default:
        return t($ => $.titlebar.menu.items.checkUpdates.default);
    }
  };

  return (
    <Dropdown.Item id="check-updates" textValue={getUpdateText()} onAction={handleAction}>
      <div className="flex items-center gap-2">
        <TbDownload className="size-4 text-foreground/80" />
        <Label>{getUpdateText()}</Label>
      </div>
    </Dropdown.Item>
  );
};
