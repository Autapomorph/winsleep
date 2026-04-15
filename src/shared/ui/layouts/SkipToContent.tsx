import { useTranslation } from 'react-i18next';
import { Button, cn } from '@heroui/react';

export const SkipToContent = () => {
  const { t } = useTranslation();

  const handleSkip = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  };

  return (
    <Button
      onPress={handleSkip}
      className={cn(
        'absolute top-12 left-4 z-10001 -translate-y-24',
        'cursor-pointer rounded-md border border-border bg-accent px-4 py-2.5 shadow-lg',
        'text-sm font-semibold text-accent-foreground',
        'transition-transform duration-200 ease-out',
        'focus:translate-y-0 focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-background focus:outline-none',
      )}
    >
      {t($ => $.common.accessibility.skipToContent)}
    </Button>
  );
};
