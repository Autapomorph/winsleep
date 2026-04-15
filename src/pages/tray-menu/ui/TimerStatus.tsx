import { cn } from '@heroui/react';

import type { TrayMenuState } from '@/shared/api';

interface Props {
  timerState: TrayMenuState['timerState'];
  isExpiring: boolean;
  timerStatusLabel: string;
}

export const TimerStatus = ({ timerState, isExpiring, timerStatusLabel }: Props) => {
  const isPaused = timerState === 'paused';

  return (
    <div
      className={cn(
        'mx-1.5 my-0.5 flex shrink-0 flex-col rounded-lg bg-surface-secondary px-3 py-2 text-center text-sm font-semibold',
        isPaused && 'bg-warning-soft text-warning-soft-foreground',
        isExpiring && !isPaused && 'bg-danger-soft text-danger-soft-foreground',
      )}
    >
      <span>{timerStatusLabel}</span>
    </div>
  );
};
