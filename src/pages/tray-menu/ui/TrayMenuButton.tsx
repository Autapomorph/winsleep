import type { ReactNode, Ref } from 'react';
import { type ButtonProps, Button, cn } from '@heroui/react';

interface Props extends ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  icon?: ReactNode;
}

export const TrayMenuButton = ({
  ref,
  className,
  size = 'sm',
  variant = 'ghost',
  fullWidth = true,
  icon,
  children,
  ...props
}: Props) => {
  return (
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
            {icon && <span className="text-muted">{icon}</span>}
            {children}
          </>
        )
      }
    </Button>
  );
};
