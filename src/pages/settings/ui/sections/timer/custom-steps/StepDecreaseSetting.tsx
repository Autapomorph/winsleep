import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { formatDurationFull } from '@/shared/lib';
import { TimerStepEditModal } from '../../../modals/TimerStepEditModal';

export const StepDecreaseSetting = () => {
  const { t } = useTranslation();
  const [isStepDecreaseModalOpen, setIsStepDecreaseModalOpen] = useState(false);

  const { timerStepDecrease, isCustomTimerStepsEnabled, setTimerStepDecrease } = useSettingsStore(
    useShallow(state => ({
      timerStepDecrease: state.timerStepDecrease,
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      setTimerStepDecrease: state.setTimerStepDecrease,
    })),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.timer.groups.customSteps.stepDecrease.label.text)}
      </Label>

      <Button
        variant="secondary"
        isDisabled={!isCustomTimerStepsEnabled}
        className="hover:bg-default-100/50 flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm"
        onPress={() => setIsStepDecreaseModalOpen(true)}
      >
        <span className="font-medium text-foreground/80">
          {formatDurationFull(timerStepDecrease, t)}
        </span>
        <span className="text-primary text-xs font-medium hover:underline">
          {t($ => $.settings.sections.timer.groups.customSteps.stepDecrease.editBtn.text)}
        </span>
      </Button>

      <TimerStepEditModal
        isOpen={isStepDecreaseModalOpen}
        initialSeconds={timerStepDecrease}
        title={t($ => $.settings.sections.timer.groups.customSteps.editModal.title.decrease)}
        onOpenChange={setIsStepDecreaseModalOpen}
        onSave={setTimerStepDecrease}
      />
    </div>
  );
};
