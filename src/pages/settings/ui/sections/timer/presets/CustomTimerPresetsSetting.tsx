import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Chip, CloseButton, Toolbar } from '@heroui/react';
import { FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import { DEFAULT_NEW_TIMER_PRESET_SECONDS } from '@/shared/config';
import { formatDurationFull } from '@/shared/lib';
import { PresetEditModal } from '../../../modals/PresetEditModal';

const NEW_PRESET_ID = 'new';

export const CustomTimerPresetsSetting = () => {
  const { t } = useTranslation();
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  const {
    customTimerPresets,
    addCustomTimerPreset,
    removeCustomTimerPreset,
    updateCustomTimerPreset,
  } = useSettingsStore(
    useShallow(state => ({
      customTimerPresets: state.customTimerPresets,
      addCustomTimerPreset: state.addCustomTimerPreset,
      removeCustomTimerPreset: state.removeCustomTimerPreset,
      updateCustomTimerPreset: state.updateCustomTimerPreset,
    })),
  );

  const editingPreset =
    editingPresetId === NEW_PRESET_ID
      ? { id: NEW_PRESET_ID, seconds: DEFAULT_NEW_TIMER_PRESET_SECONDS }
      : customTimerPresets.find(p => p.id === editingPresetId);

  return (
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
                    $ => $.settings.sections.timer.groups.presets.removeCustomPresetBtn.aria.label,
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
    </div>
  );
};
