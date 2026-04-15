import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

import { useTimerStore } from '@/entities/timer';
import { useNow } from '@/shared/lib';

interface Props {
  currentSeconds: number;
}

export const TimerTriggerLabel = ({ currentSeconds }: Props) => {
  const { t, i18n } = useTranslation();

  const nowMs = useNow();
  const { timerState, timerMode, targetDateTime, endTime, remainingSeconds, plannedSeconds } =
    useTimerStore(
      useShallow(state => ({
        timerState: state.timerState,
        timerMode: state.timerMode,
        targetDateTime: state.targetDateTime,
        endTime: state.endTime,
        remainingSeconds: state.remainingSeconds,
        plannedSeconds: state.plannedSeconds,
      })),
    );

  let triggerTimestamp: number;
  if (timerState !== 'idle') {
    triggerTimestamp = endTime ?? nowMs + remainingSeconds * 1000;
  } else if (timerMode === 'timestamp' && targetDateTime) {
    triggerTimestamp = targetDateTime;
  } else {
    triggerTimestamp = nowMs + plannedSeconds * 1000;
  }

  const triggerDate = new Date(triggerTimestamp);
  const currentDate = new Date(nowMs);
  const tomorrowDate = new Date(nowMs);
  tomorrowDate.setDate(currentDate.getDate() + 1);

  const isCurrentYear = triggerDate.getFullYear() === currentDate.getFullYear();
  const isToday = triggerDate.toDateString() === currentDate.toDateString();
  const isTomorrow = triggerDate.toDateString() === tomorrowDate.toDateString();

  const formattedTime = triggerDate.toLocaleTimeString(i18n.language, {
    timeStyle: 'short',
  });

  let triggerAtLabel = '';
  if (currentSeconds === 0) {
    triggerAtLabel = t($ => $.timer.triggerAt.now);
  } else if (isToday) {
    triggerAtLabel = t($ => $.timer.triggerAt.today, { time: formattedTime });
  } else if (isTomorrow) {
    triggerAtLabel = t($ => $.timer.triggerAt.tomorrow, { time: formattedTime });
  } else {
    const weekday = triggerDate.toLocaleDateString(i18n.language, { weekday: 'long' });
    const dayMonth = triggerDate.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'long',
    });
    const year = isCurrentYear ? '' : ` ${triggerDate.getFullYear()}`;
    const formattedDate = `${weekday}, ${dayMonth}${year}`;

    triggerAtLabel = t($ => $.timer.triggerAt.default, {
      date: formattedDate,
      time: formattedTime,
    });
  }

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs font-medium">
      {timerState === 'running' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
      )}
      {timerState === 'paused' && <span className="h-2 w-2 rounded-full bg-warning" />}
      <span>{triggerAtLabel}</span>
    </div>
  );
};
