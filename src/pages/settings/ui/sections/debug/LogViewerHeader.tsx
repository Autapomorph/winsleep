import { useTranslation } from 'react-i18next';
import { Spinner } from '@heroui/react';

export interface LogViewerHeaderContext {
  isLoadingOlder: boolean;
}

interface Props {
  context?: LogViewerHeaderContext;
}

export const LogViewerHeader = ({ context }: Props) => {
  const { t } = useTranslation();

  if (context?.isLoadingOlder) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
        <Spinner size="sm" />
        <span>{t($ => $.settings.sections.debug.groups.logs.loadingOlder)}</span>
      </div>
    );
  }

  return null;
};
