import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import { formatDurationFull } from '@/shared/lib';
import { DefaultTimerEditModal } from '../../../modals/DefaultTimerEditModal';

export const DefaultTimerSetting = () => {
  const { t } = useTranslation();
  const [isDefaultTimerModalOpen, setIsDefaultTimerModalOpen] = useState(false);

  const { defaultTimerSeconds, shouldRememberConfiguredTime, setDefaultTimerSeconds } =
    useSettingsStore(
      useShallow(state => ({
        defaultTimerSeconds: state.defaultTimerSeconds,
        shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
        setDefaultTimerSeconds: state.setDefaultTimerSeconds,
      })),
    );

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.timer.groups.basic.defaultTimer.label.text)}
      </Label>

      <Button
        variant="secondary"
        isDisabled={shouldRememberConfiguredTime}
        className="hover:bg-default-100/50 flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm"
        onPress={() => setIsDefaultTimerModalOpen(true)}
      >
        <span className="font-medium text-foreground/80">
          {formatDurationFull(defaultTimerSeconds, t)}
        </span>
        <span className="text-primary text-xs font-medium hover:underline">
          {t($ => $.settings.sections.timer.groups.basic.defaultTimer.editBtn.text)}
        </span>
      </Button>

      <DefaultTimerEditModal
        isOpen={isDefaultTimerModalOpen}
        initialSeconds={defaultTimerSeconds}
        onOpenChange={setIsDefaultTimerModalOpen}
        onSave={setDefaultTimerSeconds}
      />
    </div>
  );
};
