import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, Surface } from '@heroui/react';
import { FaTriangleExclamation } from 'react-icons/fa6';

import { logger } from '@/shared/lib';

export const PageErrorBoundary = () => {
  const error = useRouteError();
  const { t } = useTranslation();

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  useEffect(() => {
    logger.error(`Caught error: ${errorMessage}${errorStack ? `\nStack: ${errorStack}` : ''}`);
  }, [error, errorMessage, errorStack]);

  const handleRetry = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <Surface className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl p-6 shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger-soft-foreground">
          <FaTriangleExclamation className="h-8 w-8" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">
            {t($ => $.common.errors.errorBoundary.title)}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t($ => $.common.errors.errorBoundary.description)}
          </p>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-3">
          <Button
            className="h-auto flex-initial py-2.5 wrap-break-word whitespace-normal"
            variant="primary"
            onPress={handleRetry}
          >
            {t($ => $.common.errors.errorBoundary.retryBtn)}
          </Button>

          <Button
            className="h-auto flex-initial py-2.5 wrap-break-word whitespace-normal"
            variant="secondary"
            onPress={handleReload}
          >
            {t($ => $.common.errors.errorBoundary.reloadBtn)}
          </Button>
        </div>
      </Surface>
    </div>
  );
};
