import { useTranslation } from 'react-i18next';
import { Dropdown, Label } from '@heroui/react';
import { TbBulb } from 'react-icons/tb';

import { GITHUB_REPO_URL } from '@/shared/config';
import { openExternalLink } from '@/shared/lib';

export const FeatureRequest = () => {
  const { t } = useTranslation();

  const handleAction = () => {
    openExternalLink(
      `${GITHUB_REPO_URL}/issues/new?labels=enhancement&template=feature_request.yml`,
    ).catch(() => {});
  };

  return (
    <Dropdown.Item
      id="feature-request"
      textValue={t($ => $.titlebar.menu.items.featureRequest)}
      onAction={handleAction}
    >
      <div className="flex items-center gap-2">
        <TbBulb className="size-4 text-foreground/80" />
        <Label>{t($ => $.titlebar.menu.items.featureRequest)}</Label>
      </div>
    </Dropdown.Item>
  );
};
