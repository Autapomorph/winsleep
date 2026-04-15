export type UpdateInterval = 'startup' | 1 | 3 | 6 | 12 | 24;

export const DEFAULT_UPDATE_INTERVAL: UpdateInterval = 6;

export const UPDATE_INTERVALS: UpdateInterval[] = ['startup', 1, 3, 6, 12, 24];

export const DEFAULT_IS_AUTO_UPDATE_ENABLED = true;
