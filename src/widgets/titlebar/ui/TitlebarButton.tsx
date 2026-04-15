import type { Ref } from 'react';
import { type ButtonProps, Button, cn } from '@heroui/react';

interface Props extends ButtonProps {
  ref?: Ref<HTMLButtonElement>;
}

export const TitlebarButton = ({
  ref,
  className,
  variant = 'ghost',
  isIconOnly = true,
  ...props
}: Props) => {
  return (
    <Button
      ref={ref}
      className={cn('flex h-10 w-10 items-center justify-center rounded-none', className)}
      variant={variant}
      isIconOnly={isIconOnly}
      {...props}
    />
  );
};
