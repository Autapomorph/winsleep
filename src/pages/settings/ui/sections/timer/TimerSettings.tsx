import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Chip, CloseButton, Label, Switch, Toolbar } from '@heroui/react';
import { FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_NEW_TIMER_PRESET_SECONDS } from '@/shared/config';
import { formatDurationFull } from '@/shared/lib';
import { InfoTooltip } from '@/shared/ui';
import { SettingsGroup } from '../../layout/SettingsGroup';
import { SettingsSeparator } from '../../layout/SettingsSeparator';
import { DefaultTimerEditModal } from '../../modals/DefaultTimerEditModal';
import { PresetEditModal } from '../../modals/PresetEditModal';
import { TimerStepEditModal } from '../../modals/TimerStepEditModal';

export const TimerSettings = () => {
  const { t } = useTranslation();
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [isDefaultTimerModalOpen, setIsDefaultTimerModalOpen] = useState(false);
  const [isStepDecreaseModalOpen, setIsStepDecreaseModalOpen] = useState(false);
  const [isStepIncreaseModalOpen, setIsStepIncreaseModalOpen] = useState(false);

  const {
    defaultTimerSeconds,
    shouldRememberConfiguredTime,
    isCustomTimerStepsEnabled,
    timerStepIncrease,
    timerStepDecrease,
    customTimerPresets,
    isLockedByDefault,
    setDefaultTimerSeconds,
    setShouldRememberConfiguredTime,
    setIsCustomTimerStepsEnabled,
    setTimerStepIncrease,
    setTimerStepDecrease,
    addCustomTimerPreset,
    removeCustomTimerPreset,
    updateCustomTimerPreset,
    setIsLockedByDefault,
  } = useSettingsStore(
    useShallow(state => ({
      defaultTimerSeconds: state.defaultTimerSeconds,
      shouldRememberConfiguredTime: state.shouldRememberConfiguredTime,
      isCustomTimerStepsEnabled: state.isCustomTimerStepsEnabled,
      timerStepIncrease: state.timerStepIncrease,
      timerStepDecrease: state.timerStepDecrease,
      customTimerPresets: state.customTimerPresets,
      isLockedByDefault: state.isLockedByDefault,
      setDefaultTimerSeconds: state.setDefaultTimerSeconds,
      setShouldRememberConfiguredTime: state.setShouldRememberConfiguredTime,
      setIsCustomTimerStepsEnabled: state.setIsCustomTimerStepsEnabled,
      setTimerStepIncrease: state.setTimerStepIncrease,
      setTimerStepDecrease: state.setTimerStepDecrease,
      addCustomTimerPreset: state.addCustomTimerPreset,
      removeCustomTimerPreset: state.removeCustomTimerPreset,
      updateCustomTimerPreset: state.updateCustomTimerPreset,
      setIsLockedByDefault: state.setIsLockedByDefault,
    })),
  );

  const NEW_PRESET_ID = 'new';
  const editingPreset =
    editingPresetId === NEW_PRESET_ID
      ? { id: NEW_PRESET_ID, seconds: DEFAULT_NEW_TIMER_PRESET_SECONDS }
      : customTimerPresets.find(p => p.id === editingPresetId);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.timer.title)}
      </h2>

      {/* Group Basic */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.basic.title)}>
        <div className="flex flex-col gap-4">
          <Switch
            isSelected={shouldRememberConfiguredTime}
            onChange={setShouldRememberConfiguredTime}
            className="w-full"
          >
            <Switch.Content className="flex w-full items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>
                  {t(
                    $ => $.settings.sections.timer.groups.basic.rememberConfiguredTime.switch.label,
                  )}
                </span>

                <InfoTooltip className="break-normal whitespace-normal">
                  {t(
                    $ => $.settings.sections.timer.groups.basic.rememberConfiguredTime.tooltip.text,
                  )}
                </InfoTooltip>
              </div>

              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>

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
          </div>
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Security */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.security.title)}>
        <div className="flex flex-col gap-4">
          <Switch isSelected={isLockedByDefault} onChange={setIsLockedByDefault} className="w-full">
            <Switch.Content className="flex w-full items-center justify-between">
              {t($ => $.settings.sections.timer.groups.security.lockByDefault.switch.label)}

              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Custom Steps */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.customSteps.title)}>
        <div className="flex flex-col gap-4">
          <Switch
            isSelected={isCustomTimerStepsEnabled}
            onChange={setIsCustomTimerStepsEnabled}
            className="w-full"
          >
            <Switch.Content className="flex w-full items-center justify-between">
              {t($ => $.settings.sections.timer.groups.customSteps.useCustomSteps.switch.label)}

              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>

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
          </div>

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
          </div>
        </div>
      </SettingsGroup>

      <SettingsSeparator />

      {/* Group Presets */}
      <SettingsGroup title={t($ => $.settings.sections.timer.groups.presets.title)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {customTimerPresets.length > 0 && (
              <Toolbar
                orientation="horizontal"
                aria-label={t($ => $.settings.sections.timer.groups.presets.title)}
                className="flex flex-wrap items-center gap-2"
              >
                {customTimerPresets.map(preset => (
                  <Chip
                    key={preset.id}
                    variant="secondary"
                    className="hover:bg-secondary-200 h-9 max-w-full cursor-pointer rounded-full px-3 transition-transform active:scale-95"
                    onClick={() => setEditingPresetId(preset.id)}
                  >
                    <div className="flex max-w-full items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">
                        {formatDurationFull(preset.seconds, t)}
                      </span>

                      <CloseButton
                        className="h-5 w-5 min-w-0 shrink-0 opacity-70 transition-opacity hover:bg-danger-soft hover:text-danger-soft-foreground hover:opacity-100"
                        onClick={e => {
                          e.stopPropagation();
                          removeCustomTimerPreset(preset.id);
                        }}
                        aria-label={t(
                          $ =>
                            $.settings.sections.timer.groups.presets.removeCustomPresetBtn.aria
                              .label,
                        )}
                      />
                    </div>
                  </Chip>
                ))}
              </Toolbar>
            )}

            <Button
              size="sm"
              variant="ghost"
              onPress={() => setEditingPresetId(NEW_PRESET_ID)}
              className="hover:bg-default-100 h-9 rounded-full border-dashed px-4"
            >
              <FaPlus className="mr-1.5 h-3 w-3" />
              {t($ => $.settings.sections.timer.groups.presets.addCustomPresetBtn.label)}
            </Button>
          </div>
        </div>
      </SettingsGroup>

      {editingPreset && (
        <PresetEditModal
          isOpen={Boolean(editingPresetId)}
          onOpenChange={open => !open && setEditingPresetId(null)}
          initialSeconds={editingPreset.seconds}
          onSave={seconds => {
            if (editingPresetId === NEW_PRESET_ID) {
              addCustomTimerPreset(seconds);
            } else {
              updateCustomTimerPreset(editingPreset.id, { seconds });
            }
            setEditingPresetId(null);
          }}
        />
      )}

      <DefaultTimerEditModal
        isOpen={isDefaultTimerModalOpen}
        initialSeconds={defaultTimerSeconds}
        onOpenChange={setIsDefaultTimerModalOpen}
        onSave={setDefaultTimerSeconds}
      />

      <TimerStepEditModal
        isOpen={isStepDecreaseModalOpen}
        initialSeconds={timerStepDecrease}
        title={t($ => $.settings.sections.timer.groups.customSteps.editModal.title.decrease)}
        onOpenChange={setIsStepDecreaseModalOpen}
        onSave={setTimerStepDecrease}
      />

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
