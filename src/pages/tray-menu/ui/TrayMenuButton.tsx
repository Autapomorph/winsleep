import { type ReactNode, type Ref, useLayoutEffect, useRef, useState } from 'react';
import { type ButtonProps, Button, cn, Tooltip } from '@heroui/react';

import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_DEFAULT } from '@/shared/config';

interface Props extends ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  icon?: ReactNode;
  disableTruncate?: boolean;
  tooltipText?: string;
}

export const TrayMenuButton = ({
  ref,
  className,
  size = 'sm',
  variant = 'ghost',
  fullWidth = true,
  icon,
  disableTruncate = false,
  tooltipText,
  children,
  ...props
}: Props) => {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const resolvedTooltipText = tooltipText ?? (typeof children === 'string' ? children : undefined);

  useLayoutEffect(() => {
    if (disableTruncate || !resolvedTooltipText) {
      return undefined;
    }

    const checkTruncation = () => {
      const element = textRef.current;

      if (!element) {
        return;
      }

      const truncated = element.scrollWidth > element.clientWidth;

      setIsTruncated(prev => (prev !== truncated ? truncated : prev));
    };

    const element = textRef.current;

    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(checkTruncation);

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [disableTruncate, resolvedTooltipText, children]);

  const buttonElement = (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={cn('flex shrink-0 justify-start gap-3', className)}
      {...props}
    >
      {buttonRenderProps =>
        typeof children === 'function' ? (
          children(buttonRenderProps)
        ) : (
          <>
            {icon && <span className="shrink-0 text-muted">{icon}</span>}
            {typeof children === 'string' ? (
              <span
                ref={textRef}
                className={cn(
                  !disableTruncate && 'truncate',
                  disableTruncate && 'whitespace-nowrap',
                )}
              >
                {children}
              </span>
            ) : (
              children
            )}
          </>
        )
      }
    </Button>
  );

  if (disableTruncate || !resolvedTooltipText || !isTruncated) {
    return buttonElement;
  }

  return (
    <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
      {buttonElement}
      <Tooltip.Content placement="top" showArrow offset={10}>
        <Tooltip.Arrow />
        {resolvedTooltipText}
      </Tooltip.Content>
    </Tooltip>
  );
};
