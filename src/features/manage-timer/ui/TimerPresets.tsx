import { useTranslation } from 'react-i18next';
import { Button, Toolbar } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_TIMER_PRESETS } from '@/shared/config';
import { formatDurationFull, formatDurationShort } from '@/shared/lib';

interface Props {
  setExactTime: (seconds: number) => void;
  isLocked?: boolean;
}

export const TimerPresets = ({ setExactTime, isLocked = false }: Props) => {
  const { t } = useTranslation();
  const customTimerPresets = useSettingsStore(state => state.customTimerPresets);

  const getPresetLabel = (time: number) => {
    if (time === 0) {
      return t($ => $.timer.nowLabel.text);
    }

    return formatDurationShort(time, t);
  };

  const getPresetAriaLabel = (time: number) => {
    if (time === 0) {
      return t($ => $.timer.nowLabel.text);
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
