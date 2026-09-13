import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';

import { useKeepAwakeStore } from '@/entities/keep-awake';
import { useSessionStore } from '@/entities/session';
import { useTimerStore } from '@/entities/timer';
import { type TimerAction } from '@/shared/config';
import { useNow } from '@/shared/lib';

interface Props {
  action?: TimerAction;
  currentSeconds: number;
}

export const TimerTriggerLabel = ({ currentSeconds, action }: Props) => {
  const { t, i18n } = useTranslation();
  const sessionAction = useSessionStore(state => state.timerAction);
  const isIndefiniteActive = useKeepAwakeStore(state => state.isIndefiniteActive);

  const currentAction = action ?? sessionAction;
  const isKeepAwake = currentAction === 'keep-awake';

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
    if (isKeepAwake) {
      triggerAtLabel =
        timerState === 'running' || isIndefiniteActive
          ? t($ => $.timer.triggerAt.keepAwakeIndefiniteRunning)
          : t($ => $.timer.triggerAt.keepAwakeIndefiniteIdle);
    } else {
      triggerAtLabel = t($ => $.timer.triggerAt.now);
    }
  } else if (isToday) {
    triggerAtLabel = isKeepAwake
      ? t($ => $.timer.triggerAt.keepAwakeToday, { time: formattedTime })
      : t($ => $.timer.triggerAt.today, { time: formattedTime });
  } else if (isTomorrow) {
    triggerAtLabel = isKeepAwake
      ? t($ => $.timer.triggerAt.keepAwakeTomorrow, { time: formattedTime })
      : t($ => $.timer.triggerAt.tomorrow, { time: formattedTime });
  } else {
    const weekday = triggerDate.toLocaleDateString(i18n.language, { weekday: 'long' });
    const dayMonth = triggerDate.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'long',
    });
    const year = isCurrentYear ? '' : ` ${triggerDate.getFullYear()}`;
    const formattedDate = `${weekday}, ${dayMonth}${year}`;

    triggerAtLabel = isKeepAwake
      ? t($ => $.timer.triggerAt.keepAwakeDefault, {
          date: formattedDate,
          time: formattedTime,
        })
      : t($ => $.timer.triggerAt.default, {
          date: formattedDate,
          time: formattedTime,
        });
  }

  const isRunning = timerState === 'running' || isIndefiniteActive;

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs font-medium">
      {isRunning && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
      )}

      {!isIndefiniteActive && !(isKeepAwake && currentSeconds === 0) && timerState === 'paused' && (
        <span className="h-2 w-2 rounded-full bg-warning" />
      )}
      <span>{triggerAtLabel}</span>
    </div>
  );
};
