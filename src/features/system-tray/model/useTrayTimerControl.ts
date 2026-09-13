import { useTrayLockControl } from './useTrayLockControl';
import { useTrayPresetSelection } from './useTrayPresetSelection';
import { useTrayStepControl } from './useTrayStepControl';
import { useTrayTimerActions } from './useTrayTimerActions';

export const useTrayTimerControl = () => {
  useTrayTimerActions();
  useTrayPresetSelection();
  useTrayStepControl();
  useTrayLockControl();
};
