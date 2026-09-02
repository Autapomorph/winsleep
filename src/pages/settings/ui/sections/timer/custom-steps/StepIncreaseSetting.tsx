import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { formatDurationFull } from '@/shared/lib';
import { TimerStepEditModal } from '../../../modals/TimerStepEditModal';

export const StepIncreaseSetting = () => {
  const { t } = useTranslation();
  const [isStepIncreaseModalOpen, setIsStepIncreaseModalOpen] = useState(false);

  const { timerStepIncrease, isCustomTimerStepsEnabled, setTimerStepIncrease } = useSettingsStore(
    useShallow(state => ({
      timerStepIncrease: state.timerStepIncrease,
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      setTimerStepIncrease: state.setTimerStepIncrease,
    })),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.timer.groups.customSteps.stepIncrease.label.text)}
      </Label>

      <Button
        variant="secondary"
        isDisabled={!isCustomTimerStepsEnabled}
        className="hover:bg-default-100/50 flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm"
        onPress={() => setIsStepIncreaseModalOpen(true)}
      >
        <span className="font-medium text-foreground/80">
          {formatDurationFull(timerStepIncrease, t)}
        </span>
        <span className="text-primary text-xs font-medium hover:underline">
          {t($ => $.settings.sections.timer.groups.customSteps.stepIncrease.editBtn.text)}
        </span>
      </Button>

      <TimerStepEditModal
        isOpen={isStepIncreaseModalOpen}
        initialSeconds={timerStepIncrease}
        title={t($ => $.settings.sections.timer.groups.customSteps.editModal.title.increase)}
        onOpenChange={setIsStepIncreaseModalOpen}
        onSave={setTimerStepIncrease}
      />
    </div>
  );
};
