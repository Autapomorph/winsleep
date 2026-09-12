import { useTranslation } from 'react-i18next';
import { Button, Toolbar } from '@heroui/react';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/entities/setting';
import { type TimerAction, DEFAULT_TIMER_PRESETS } from '@/shared/config';
import { formatDurationFull, formatDurationShort } from '@/shared/lib';

interface Props {
  action?: TimerAction;
  isLocked?: boolean;
  setExactTime: (seconds: number) => void;
}

export const TimerPresets = ({ action, isLocked = false, setExactTime }: Props) => {
  const { t } = useTranslation();
  const sessionAction = useSessionStore(state => state.timerAction);
  const customTimerPresets = useSettingsStore(state => state.customTimerPresets);

  const currentAction = action ?? sessionAction;
  const isKeepAwake = currentAction === 'keep-awake';

  const getPresetLabel = (time: number) => {
    if (time === 0) {
      return isKeepAwake ? t($ => $.timer.indefiniteLabel.text) : t($ => $.timer.nowLabel.text);
    }

    return formatDurationShort(time, t);
  };

  const getPresetAriaLabel = (time: number) => {
    if (time === 0) {
      return isKeepAwake ? t($ => $.timer.indefiniteLabel.text) : t($ => $.timer.nowLabel.text);
    }

    return formatDurationFull(time, t);
  };

  const customSeconds = customTimerPresets.map(p => p.seconds);
  const allPresetSeconds = Array.from(new Set([...DEFAULT_TIMER_PRESETS, ...customSeconds])).sort(
    (a, b) => a - b,
  );

  const presets = allPresetSeconds.map(time => ({
    time,
    label: getPresetLabel(time),
    ariaLabel: getPresetAriaLabel(time),
  }));

  return (
    <Toolbar aria-label={t($ => $.timer.presets.aria.label)}>
      <div className="grid grid-cols-3 place-items-center gap-2.5">
        {presets.map(({ time, label, ariaLabel }) => (
          <Button
            key={time}
            size="sm"
            variant="outline"
            className="w-full min-w-0"
            onPress={() => setExactTime(time)}
            isDisabled={isLocked}
            aria-label={ariaLabel}
          >
            <span className="min-w-0 truncate">{label}</span>
          </Button>
        ))}
      </div>
    </Toolbar>
  );
};
