import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { type TooltipContentProps, Tooltip } from '@heroui/react';
import { FaCircleInfo } from 'react-icons/fa6';

import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_INSTANT } from '@/shared/config';

export interface InfoTooltipProps {
  placement?: TooltipContentProps['placement'];
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export const InfoTooltip = ({
  placement = 'top',
  className,
  children,
  ariaLabel,
}: InfoTooltipProps) => {
  const { t } = useTranslation();
  const ariaLabelText = ariaLabel ?? t($ => $.common.tooltip.aria.label);

  return (
    <Tooltip delay={TOOLTIP_DELAY_INSTANT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
      <Tooltip.Trigger
        className="rounded-full p-2 hover:bg-default-hover"
        aria-label={ariaLabelText}
      >
        <FaCircleInfo />
      </Tooltip.Trigger>

      <Tooltip.Content className={className} placement={placement} showArrow offset={10}>
        <Tooltip.Arrow />
        {children}
      </Tooltip.Content>
    </Tooltip>
  );
};
