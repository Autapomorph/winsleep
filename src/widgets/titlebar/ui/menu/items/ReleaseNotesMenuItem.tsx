import { useTranslation } from 'react-i18next';
import { Dropdown, Label } from '@heroui/react';
import { TbListCheck } from 'react-icons/tb';

import { useViewReleaseNotes } from '@/features/check-updates';

export const ViewReleaseNotes = () => {
  const { t } = useTranslation();
  const viewReleaseNotes = useViewReleaseNotes();

  const handleAction = () => {
    viewReleaseNotes().catch(() => {});
  };

  return (
    <Dropdown.Item
      id="view-release-notes"
      textValue={t($ => $.titlebar.menu.items.viewReleaseNotes)}
      onAction={handleAction}
    >
      <div className="flex items-center gap-2">
        <TbListCheck className="size-4 text-foreground/80" />
        <Label>{t($ => $.titlebar.menu.items.viewReleaseNotes)}</Label>
      </div>
    </Dropdown.Item>
  );
};
