import { getHMS } from './getHMS';

export const formatTime = (totalSeconds: number): string => {
  const { hours, minutes, seconds } = getHMS(Math.ceil(totalSeconds));

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
};
