export interface CustomTimerPreset {
  id: string;
  seconds: number;
}

export const serializeCustomTimerPresets = (presets: CustomTimerPreset[]): number[] => {
  return presets.map(p => p.seconds);
};

export const deserializeCustomTimerPresets = (secondsArray: number[]): CustomTimerPreset[] => {
  return secondsArray.map(seconds => ({
    id: crypto.randomUUID(),
    seconds,
  }));
};
