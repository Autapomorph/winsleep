import { type StateCreator } from 'zustand';

import { DEFAULT_ZOOM, ZOOM_STEP } from '@/shared/config';
import { clampZoom } from '@/shared/lib';
import { initialActionState } from './action.slice';
import { initialNotificationState } from './notification.slice';
import { initialSystemState } from './system.slice';
import { initialTimerState } from './timer.slice';
import { type SettingsStore } from '../settings.store';

export type GeneralSlice = GeneralState & GeneralActions;

export interface GeneralState {
  zoomFactor: number;
}

export interface GeneralActions {
  setZoomFactor: (zoomFactor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  resetToDefaults: () => void;
}

export const initialGeneralState: GeneralState = {
  zoomFactor: DEFAULT_ZOOM,
};

export const createGeneralSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  GeneralSlice
> = (set, get) => ({
  ...initialGeneralState,

  setZoomFactor: zoomFactor => {
    set({ zoomFactor: clampZoom(zoomFactor) }, false, 'settings/setZoomFactor');
  },

  zoomIn: () => {
    const current = get().zoomFactor;
    set({ zoomFactor: clampZoom(current + ZOOM_STEP) }, false, 'settings/zoomIn');
  },

  zoomOut: () => {
    const current = get().zoomFactor;
    set({ zoomFactor: clampZoom(current - ZOOM_STEP) }, false, 'settings/zoomOut');
  },

  resetZoom: () => {
    set({ zoomFactor: DEFAULT_ZOOM }, false, 'settings/resetZoom');
  },

  resetToDefaults: () =>
    set(
      {
        ...initialActionState,
        ...initialTimerState,
        ...initialNotificationState,
        ...initialSystemState,
        ...initialGeneralState,
        hasSeenTrayNotification: get().hasSeenTrayNotification,
      },
      false,
      'settings/resetToDefaults',
    ),
});
