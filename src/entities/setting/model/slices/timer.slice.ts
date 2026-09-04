import { type StateCreator } from 'zustand';

import {
  DEFAULT_CUSTOM_TIMER_PRESETS,
  DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED,
  DEFAULT_IS_LOCKED_BY_DEFAULT,
  DEFAULT_IS_RESTORE_SCHEDULED_TIMER_ON_STARTUP_ENABLED,
  DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME,
  DEFAULT_TIMER_SECONDS,
  DEFAULT_TIMER_STEP_SECONDS,
} from '@/shared/config';
import { type SettingsStore } from '../settings.store';
import { type CustomTimerPreset } from '../timerPreset';

export type TimerSlice = TimerState & TimerActions;

export interface TimerState {
  defaultTimerSeconds: number;
  shouldRememberConfiguredTime: boolean;
  isLockedByDefault: boolean;
  isRestoreScheduledTimerOnStartupEnabled: boolean;
  isCustomTimerStepsEnabled: boolean;
  timerStepIncrease: number;
  timerStepDecrease: number;
  customTimerPresets: CustomTimerPreset[];
}

export interface TimerActions {
  setDefaultTimerSeconds: (defaultTimerSeconds: number) => void;
  setShouldRememberConfiguredTime: (shouldRememberConfiguredTime: boolean) => void;
  setIsLockedByDefault: (isLockedByDefault: boolean) => void;
  setIsRestoreScheduledTimerOnStartupEnabled: (
    isRestoreScheduledTimerOnStartupEnabled: boolean,
  ) => void;
  setIsCustomTimerStepsEnabled: (isCustomTimerStepsEnabled: boolean) => void;
  setTimerStepIncrease: (timerStepIncrease: number) => void;
  setTimerStepDecrease: (timerStepDecrease: number) => void;
  addCustomTimerPreset: (customTimerPresetSeconds: number) => void;
  updateCustomTimerPreset: (id: string, preset: Partial<Omit<CustomTimerPreset, 'id'>>) => void;
  removeCustomTimerPreset: (id: string) => void;
}

export const initialTimerState: TimerState = {
  customTimerPresets: DEFAULT_CUSTOM_TIMER_PRESETS.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  })),
  defaultTimerSeconds: DEFAULT_TIMER_SECONDS,
  isCustomTimerStepsEnabled: DEFAULT_IS_CUSTOM_TIMER_STEPS_ENABLED,
  isLockedByDefault: DEFAULT_IS_LOCKED_BY_DEFAULT,
  isRestoreScheduledTimerOnStartupEnabled: DEFAULT_IS_RESTORE_SCHEDULED_TIMER_ON_STARTUP_ENABLED,
  shouldRememberConfiguredTime: DEFAULT_SHOULD_REMEMBER_CONFIGURED_TIME,
  timerStepDecrease: DEFAULT_TIMER_STEP_SECONDS,
  timerStepIncrease: DEFAULT_TIMER_STEP_SECONDS,
};

export const createTimerSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]],
  [],
  TimerSlice
> = set => ({
  ...initialTimerState,

  addCustomTimerPreset: customTimerPresetSeconds =>
    set(
      state => ({
        customTimerPresets: [
          ...state.customTimerPresets,
          { id: crypto.randomUUID(), seconds: customTimerPresetSeconds },
        ],
      }),
      false,
      'settings/addCustomTimerPreset',
    ),

  removeCustomTimerPreset: id =>
    set(
      state => ({
        customTimerPresets: state.customTimerPresets.filter(p => p.id !== id),
      }),
      false,
      'settings/removeCustomTimerPreset',
    ),

  setDefaultTimerSeconds: defaultTimerSeconds =>
    set({ defaultTimerSeconds }, false, 'settings/setDefaultTimerSeconds'),

  setIsCustomTimerStepsEnabled: isCustomTimerStepsEnabled =>
    set({ isCustomTimerStepsEnabled }, false, 'settings/setIsCustomTimerStepsEnabled'),

  setIsLockedByDefault: isLockedByDefault =>
    set({ isLockedByDefault }, false, 'settings/setIsLockedByDefault'),

  setIsRestoreScheduledTimerOnStartupEnabled: isRestoreScheduledTimerOnStartupEnabled =>
    set(
      { isRestoreScheduledTimerOnStartupEnabled },
      false,
      'settings/setIsRestoreScheduledTimerOnStartupEnabled',
    ),

  setShouldRememberConfiguredTime: shouldRememberConfiguredTime =>
    set({ shouldRememberConfiguredTime }, false, 'settings/setShouldRememberConfiguredTime'),

  setTimerStepDecrease: timerStepDecrease =>
    set({ timerStepDecrease }, false, 'settings/setTimerStepDecrease'),

  setTimerStepIncrease: timerStepIncrease =>
    set({ timerStepIncrease }, false, 'settings/setTimerStepIncrease'),

  updateCustomTimerPreset: (id, preset) =>
    set(
      state => ({
        customTimerPresets: state.customTimerPresets.map(p =>
          p.id === id ? { ...p, ...preset } : p,
        ),
      }),
      false,
      'settings/updateCustomTimerPreset',
    ),
});
