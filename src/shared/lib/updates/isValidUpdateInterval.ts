import { type UpdateInterval, UPDATE_INTERVALS } from '@/shared/config';

export const isValidUpdateInterval = (val: unknown): val is UpdateInterval => {
  return UPDATE_INTERVALS.some(interval => interval === val);
};
