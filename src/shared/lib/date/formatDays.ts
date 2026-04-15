import type { TFunction } from 'i18next';

import { SECONDS_IN_DAY } from '@/shared/config';

export const formatDays = (totalSeconds: number, t: TFunction): string | null => {
  if (totalSeconds < SECONDS_IN_DAY) {
    return null;
  }

  const days = Math.round(totalSeconds / SECONDS_IN_DAY);
  return `${days} ${t($ => $.common.time.units.day.full, { count: days })}`;
};
