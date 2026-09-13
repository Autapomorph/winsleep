import { useTranslation } from 'react-i18next';

import { type TimerMode, type TimerState } from '@/entities/timer';
import { SECONDS_IN_DAY } from '@/shared/config';
import { formatDays, formatTime, useNow } from '@/shared/lib';

interface Props {
  currentSeconds: number;
  timerMode: TimerMode;
  targetDateTime: number | null;
  timerState: TimerState;
}

export const useFormattedTimerTime = ({
  currentSeconds,
  timerMode,
  targetDateTime,
  timerState,
}: Props): string => {
  const { t } = useTranslation();
  const nowMs = useNow();

  if (timerMode === 'timestamp' && targetDateTime) {
    const targetDate = new Date(targetDateTime);
    const currentDate = new Date(nowMs);
    const tomorrowDate = new Date(nowMs);

    tomorrowDate.setDate(currentDate.getDate() + 1);

    const isToday = targetDate.toDateString() === currentDate.toDateString();
    const isTomorrow = targetDate.toDateString() === tomorrowDate.toDateString();

    if (timerState !== 'idle' && currentSeconds < SECONDS_IN_DAY) {
      return formatTime(currentSeconds);
    }

    if (isToday) {
      return t($ => $.timer.timerDisplay.today);
    }

    if (isTomorrow) {
      return t($ => $.timer.timerDisplay.tomorrow);
    }

    return formatDays(currentSeconds, t) ?? formatTime(currentSeconds);
  }

  return formatDays(currentSeconds, t) ?? formatTime(currentSeconds);
};
