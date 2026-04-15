import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';

import type { TimerMode, TimerState } from '@/entities/timer';

interface Props {
  timerState: TimerState;
  timerMode: TimerMode;
  isLocked?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const TimerControls = ({
  timerState,
  timerMode,
  isLocked = false,
  onStart,
  onPause,
  onResume,
  onCancel,
}: Props) => {
  const { t } = useTranslation();

  const startStopButtonConfig = {
    idle: {
      onPress: onStart,
      isDisabled: false,
      label: t($ => $.timer.startBtn.text),
      aria: {
        label: t($ => $.timer.startBtn.aria.label),
      },
    },
    running: {
      onPress: onPause,
      isDisabled: isLocked,
      label: t($ => $.timer.pauseBtn.text),
      aria: {
        label: t($ => $.timer.pauseBtn.aria.label),
      },
    },
    paused: {
      onPress: onResume,
      isDisabled: isLocked,
      label: t($ => $.timer.resumeBtn.text),
      aria: {
        label: t($ => $.timer.resumeBtn.aria.label),
      },
    },
  };

  const {
    onPress: onStartStopPress,
    isDisabled: isStartStopDisabled,
    label: startStopLabel,
    aria: { label: startStopAriaLabel },
  } = startStopButtonConfig[timerState];

  const isStatStopAvailable = timerState !== 'running' || timerMode !== 'timestamp';

  return (
    <div className="flex justify-center gap-5">
      {isStatStopAvailable && (
        <Button
          isDisabled={isStartStopDisabled}
          onPress={onStartStopPress}
          aria-label={startStopAriaLabel}
        >
          {startStopLabel}
        </Button>
      )}

      <Button
        isDisabled={timerState === 'idle' || isLocked}
        onPress={onCancel}
        aria-label={t($ => $.timer.cancelBtn.aria.label)}
      >
        {t($ => $.timer.cancelBtn.text)}
      </Button>
    </div>
  );
};
