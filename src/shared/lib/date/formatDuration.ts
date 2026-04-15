import type { TFunction } from 'i18next';

import { getHMS } from './getHMS';

type DurationVariant = 'short' | 'abbr' | 'full';

type TimeUnit = 'hour' | 'minute' | 'second';

export const formatDuration = (
  totalSeconds: number,
  t: TFunction,
  variant: DurationVariant = 'short',
) => {
  const unitDelimeter = variant === 'short' ? '' : ' ';

  const getUnitText = (unit: TimeUnit, value: number) => {
    if (variant === 'short') {
      return t($ => $.common.time.units[unit].short);
    }

    if (variant === 'abbr') {
      return t($ => $.common.time.units[unit].abbr, { count: value });
    }

    return t($ => $.common.time.units[unit].full, { count: value });
  };

  if (totalSeconds === 0) {
    return `0${unitDelimeter}${getUnitText('second', 0)}`;
  }

  const { hours, minutes, seconds } = getHMS(totalSeconds);
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}${unitDelimeter}${getUnitText('hour', hours)}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}${unitDelimeter}${getUnitText('minute', minutes)}`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}${unitDelimeter}${getUnitText('second', seconds)}`);
  }

  return parts.join(' ');
};

export const formatDurationShort = (totalSeconds: number, t: TFunction) =>
  formatDuration(totalSeconds, t, 'short');

export const formatDurationAbbr = (totalSeconds: number, t: TFunction) =>
  formatDuration(totalSeconds, t, 'abbr');

export const formatDurationFull = (totalSeconds: number, t: TFunction) =>
  formatDuration(totalSeconds, t, 'full');
