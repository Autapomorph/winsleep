import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Label, Surface, Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { WheelPicker } from '@/shared/ui';

interface Props {
  hours: number;
  minutes: number;
  seconds: number;
  onChangeHours: (val: number | ((prev: number) => number)) => void;
  onChangeMinutes: (val: number | ((prev: number) => number)) => void;
  onChangeSeconds: (val: number | ((prev: number) => number)) => void;
}

export const DurationPickerPanel = ({
  hours,
  minutes,
  seconds,
  onChangeHours,
  onChangeMinutes,
  onChangeSeconds,
}: Props) => {
  const { t } = useTranslation();

  const { shouldRememberConfiguredTime, setShouldRememberConfiguredTime } = useSettingsStore(
    useShallow(state => ({
      shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
      setShouldRememberConfiguredTime: state.setShouldRememberConfiguredTime,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <Surface className="flex items-center justify-center gap-1 rounded-xl border border-border/50 p-4">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <WheelPicker
            value={hours}
            min={0}
            max={24}
            isInfinite
            onChange={onChangeHours}
            ariaLabel={t($ => $.common.time.units.hour.full, { count: hours })}
          />

          <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
            {t($ => $.common.time.units.hour.full, { count: hours })}
          </Label>
        </div>

        {/* Hours - minutes separator (:) */}
        <span className="-mt-6 font-mono text-2xl opacity-30 sm:text-3xl">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <WheelPicker
            value={minutes}
            min={0}
            max={59}
            isInfinite
            onChange={onChangeMinutes}
            ariaLabel={t($ => $.common.time.units.minute.full, { count: minutes })}
          />

          <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
            {t($ => $.common.time.units.minute.full, { count: minutes })}
          </Label>
        </div>

        {/* Minutes - seconds separator (:) */}
        <span className="-mt-6 font-mono text-2xl opacity-30 sm:text-3xl">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <WheelPicker
            value={seconds}
            min={0}
            max={59}
            isInfinite
            onChange={onChangeSeconds}
            ariaLabel={t($ => $.common.time.units.second.full, { count: seconds })}
          />

          <Label className="text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-70">
            {t($ => $.common.time.units.second.full, { count: seconds })}
          </Label>
        </div>
      </Surface>

      <Surface className="flex items-center justify-between rounded-xl border border-border/40 bg-default/5 p-3 hover:bg-default/10">
        <Switch
          className="w-full"
          isSelected={shouldRememberConfiguredTime}
          onChange={setShouldRememberConfiguredTime}
        >
          <Switch.Content className="flex w-full items-center justify-between">
            {t($ => $.settings.sections.timer.groups.basic.rememberConfiguredTime.switch.label)}

            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Surface>
    </div>
  );
};
