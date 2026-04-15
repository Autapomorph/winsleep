import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, cn, Kbd, Tooltip, useOverlayState } from '@heroui/react';
import { FaMinus, FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import {
  DANGER_THRESHOLD_SECONDS,
  DEFAULT_TIMER_STEP_SECONDS,
  useTimerStore,
} from '@/entities/timer';
import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_LONG } from '@/shared/config';
import { formatDurationShort, useLongPress } from '@/shared/lib';
import { TimerEditModal } from './TimerEditModal';

interface Props {
  currentSeconds: number;
  formattedTime: string;
  increaseTime: () => void;
  decreaseTime: () => void;
  setExactTime: (seconds: number) => void;
  isDecreaseAllowed: boolean;
  isIncreaseAllowed: boolean;
  isLocked?: boolean;
}

export const TimerDisplay = ({
  currentSeconds,
  formattedTime,
  increaseTime,
  decreaseTime,
  setExactTime,
  isDecreaseAllowed,
  isIncreaseAllowed,
  isLocked = false,
}: Props) => {
  const { t } = useTranslation();
  const modalState = useOverlayState();
  const decreaseTimeBtnLongPressProps = useLongPress(decreaseTime);
  const increaseTimeBtnLongPressProps = useLongPress(increaseTime);

  const { timerState, timerMode } = useTimerStore(
    useShallow(state => ({
      timerState: state.timerState,
      timerMode: state.timerMode,
    })),
  );
  const isPaused = timerState === 'paused';
  const isExpiring = timerState === 'running' && currentSeconds <= DANGER_THRESHOLD_SECONDS;
  const isTimestampMode = timerMode === 'timestamp';

  const { isCustomTimerStepsEnabled, timerStepIncrease, timerStepDecrease } = useSettingsStore(
    useShallow(state => ({
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      timerStepIncrease: state.timerStepIncrease,
      timerStepDecrease: state.timerStepDecrease,
    })),
  );

  const stepIncrease = isCustomTimerStepsEnabled ? timerStepIncrease : DEFAULT_TIMER_STEP_SECONDS;
  const stepDecrease = isCustomTimerStepsEnabled ? timerStepDecrease : DEFAULT_TIMER_STEP_SECONDS;

  const formatStep = (seconds: number) => formatDurationShort(seconds, t);

  return (
    <div className="flex items-center justify-center gap-5">
      {/* Decrease time button */}
      <Tooltip delay={TOOLTIP_DELAY_LONG} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
        <Button
          isDisabled={!isDecreaseAllowed || isLocked || isTimestampMode}
          isIconOnly
          {...decreaseTimeBtnLongPressProps}
          aria-label={t($ => $.timer.decreaseTimeBtn.aria.label, {
            amount: formatStep(stepDecrease),
          })}
          aria-keyshortcuts="-"
        >
          <FaMinus />
        </Button>

        <Tooltip.Content placement="bottom" offset={7}>
          {t($ => $.timer.decreaseTimeBtn.tooltip, {
            amount: formatStep(stepDecrease),
          })}

          <Kbd className="ml-2" aria-hidden="true">
            <Kbd.Content>-</Kbd.Content>
          </Kbd>
        </Tooltip.Content>
      </Tooltip>

      {/* Time display */}
      <span
        className={cn(
          'w-24 rounded-3xl py-1 text-center text-xl font-bold tabular-nums transition-opacity',
          isPaused && 'bg-warning-soft text-warning-soft-foreground',
          isExpiring && 'bg-danger-soft text-danger-soft-foreground',
          isLocked ? 'cursor-default' : 'cursor-pointer hover:opacity-80',
        )}
        onClick={isLocked ? undefined : modalState.open}
        onKeyDown={e => {
          if (isLocked) {
            return;
          }

          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            modalState.open();
          }
        }}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label={t($ => $.timer.editTimeBtn.aria.label)}
        aria-haspopup="dialog"
        aria-disabled={isLocked}
        aria-expanded={modalState.isOpen}
      >
        {formattedTime}
      </span>

      <TimerEditModal
        isOpen={modalState.isOpen}
        currentSeconds={currentSeconds}
        setExactTime={setExactTime}
        onOpenChange={modalState.setOpen}
      />

      {/* Increase time button */}
      <Tooltip delay={TOOLTIP_DELAY_LONG} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
        <Button
          isDisabled={!isIncreaseAllowed || isLocked || isTimestampMode}
          isIconOnly
          {...increaseTimeBtnLongPressProps}
          aria-label={t($ => $.timer.increaseTimeBtn.aria.label, {
            amount: formatStep(stepIncrease),
          })}
          aria-keyshortcuts="+"
        >
          <FaPlus />
        </Button>

        <Tooltip.Content placement="bottom" offset={7}>
          {t($ => $.timer.increaseTimeBtn.tooltip, {
            amount: formatStep(stepIncrease),
          })}

          <Kbd className="ml-2" aria-hidden="true">
            <Kbd.Content>+</Kbd.Content>
          </Kbd>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
};
