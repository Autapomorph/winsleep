export type TimerState = 'idle' | 'running' | 'paused';

export type TimerMode = 'duration' | 'timestamp';

export const MIN_SECONDS = 1; // Minimum timer value in seconds (1 second)

export const MAX_SECONDS = 60 * 60 * 24; // Maximum timer value in seconds (24 hours)

export const DANGER_THRESHOLD_SECONDS = 60; // Threshold under which the timer is considered close to expiration (1 minute)
