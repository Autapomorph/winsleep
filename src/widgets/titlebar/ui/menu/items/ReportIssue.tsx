import { useTranslation } from 'react-i18next';
import { Dropdown, Label } from '@heroui/react';
import { TbBug } from 'react-icons/tb';

import { GITHUB_REPO_URL } from '@/shared/config';
import { openExternalLink } from '@/shared/lib';

export const ReportIssue = () => {
  const { t } = useTranslation();

  const handleAction = () => {
    openExternalLink(`${GITHUB_REPO_URL}/issues/new?labels=bug&template=issue_report.yml`).catch(
      () => {},
    );
  };

  return (
    <Dropdown.Item
      id="report-issue"
      textValue={t($ => $.titlebar.menu.items.reportIssue)}
      onAction={handleAction}
    >
      <div className="flex items-center gap-2">
        <TbBug className="size-4 text-foreground/80" />
        <Label>{t($ => $.titlebar.menu.items.reportIssue)}</Label>
      </div>
    </Dropdown.Item>
  );
};
