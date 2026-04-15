import { type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { cn, Tooltip } from '@heroui/react';
import { AiOutlineSync } from 'react-icons/ai';
import { MdErrorOutline } from 'react-icons/md';
import { TbDownload } from 'react-icons/tb';

import { useUpdater, useUpdateStore } from '@/entities/updater';
import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_DEFAULT } from '@/shared/config';

interface Props {
  ButtonComponent: React.ComponentType<{
    className?: string;
    onPress?: () => void;
    'aria-label'?: string;
    children?: ReactNode;
  }>;
}

export const UpdateButton = ({ ButtonComponent }: Props) => {
  const { t } = useTranslation();
  const { status, downloadProgress, isManualCheck } = useUpdateStore(
    useShallow(state => ({
      status: state.status,
      isManualCheck: state.isManualCheck,
      downloadProgress: state.downloadProgress,
    })),
  );
  const update = useUpdater();

  const isVisible =
    (status === 'checking' && isManualCheck) ||
    status === 'available' ||
    status === 'downloading' ||
    status === 'readyToRestart' ||
    (status === 'error' && isManualCheck);

  if (!isVisible) {
    return null;
  }

  const renderIcon = () => {
    if (status === 'checking') {
      return <AiOutlineSync className="animate-spin" fontSize={16} />;
    }

    if (status === 'error') {
      return <MdErrorOutline className="text-danger" fontSize={16} />;
    }

    return <TbDownload className={cn(status === 'downloading' && 'animate-pulse')} fontSize={16} />;
  };

  const renderIconAttention = () => {
    if (status === 'readyToRestart') {
      return (
        <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5 animate-pulse">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
        </span>
      );
    }

    return null;
  };

  const getTooltip = () => {
    switch (status) {
      case 'checking':
        return t($ => $.titlebar.updateBtn.tooltip.checking);
      case 'available':
        return t($ => $.titlebar.updateBtn.tooltip.available);
      case 'downloading':
        return t($ => $.titlebar.updateBtn.tooltip.downloading, { progress: downloadProgress });
      case 'readyToRestart':
        return t($ => $.titlebar.updateBtn.tooltip.readyToRestart);
      case 'error':
        return t($ => $.titlebar.updateBtn.tooltip.error);
      default:
        return t($ => $.titlebar.updateBtn.tooltip.default);
    }
  };

  const getAriaLabel = () => {
    switch (status) {
      case 'checking':
        return t($ => $.titlebar.updateBtn.aria.label.checking);
      case 'available':
        return t($ => $.titlebar.updateBtn.aria.label.available);
      case 'downloading':
        return t($ => $.titlebar.updateBtn.aria.label.downloading);
      case 'readyToRestart':
        return t($ => $.titlebar.updateBtn.aria.label.readyToRestart);
      case 'error':
        return t($ => $.titlebar.updateBtn.aria.label.error);
      default:
        return t($ => $.titlebar.updateBtn.aria.label.default);
    }
  };

  return (
    <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
      <ButtonComponent
        className={cn(
          'text-primary hover:bg-primary/5 hover:text-primary relative',
          (status === 'checking' || status === 'downloading') && 'cursor-default',
        )}
        onPress={update}
        aria-label={getAriaLabel()}
      >
        {renderIcon()}
        {renderIconAttention()}
      </ButtonComponent>

      <Tooltip.Content placement="bottom">{getTooltip()}</Tooltip.Content>
    </Tooltip>
  );
};
