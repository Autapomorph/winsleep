import { useTranslation } from 'react-i18next';
import { Dropdown, Label } from '@heroui/react';
import { TbListCheck } from 'react-icons/tb';

import { useViewChangelog } from '@/features/check-updates';

export const ViewChangelog = () => {
  const { t } = useTranslation();
  const viewChangelog = useViewChangelog();

  const handleAction = () => {
    viewChangelog().catch(() => {});
  };

  return (
    <Dropdown.Item
      id="view-changelog"
      textValue={t($ => $.titlebar.menu.items.viewChangelog)}
      onAction={handleAction}
    >
      <div className="flex items-center gap-2">
        <TbListCheck className="size-4 text-foreground/80" />
        <Label>{t($ => $.titlebar.menu.items.viewChangelog)}</Label>
      </div>
    </Dropdown.Item>
  );
};
