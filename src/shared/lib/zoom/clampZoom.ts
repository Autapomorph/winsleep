import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from '@/shared/config';

export const clampZoom = (zoom: number): number => {
  if (typeof zoom !== 'number' || Number.isNaN(zoom)) {
    return DEFAULT_ZOOM;
  }

  const rounded = Math.round(zoom * 100) / 100;
  return Math.min(Math.max(rounded, MIN_ZOOM), MAX_ZOOM);
};

export const formatZoomPercentage = (zoom: number): string => {
  return `${Math.round(zoom * 100)}%`;
};
