export const DEFAULT_ZOOM = 1.0;
export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 1.3;
export const ZOOM_STEP = 0.1;

export const ZOOM_LEVELS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number];
