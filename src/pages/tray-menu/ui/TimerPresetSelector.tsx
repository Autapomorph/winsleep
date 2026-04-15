import { useState } from 'react';
import { Button, Disclosure, Toolbar } from '@heroui/react';
import { FaClock } from 'react-icons/fa6';

import { type TrayMenuState, typedEmit } from '@/shared/api';
import { TrayMenuButton } from './TrayMenuButton';

interface Props {
  presets: TrayMenuState['timerPresets'];
  presetsLabel: string;
  isSettingsLocked: boolean;
}

export const TimerPresetSelector = ({ presets, presetsLabel, isSettingsLocked }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevIsSettingsLocked, setPrevIsSettingsLocked] = useState(isSettingsLocked);

  if (isSettingsLocked !== prevIsSettingsLocked) {
    setPrevIsSettingsLocked(isSettingsLocked);

    if (isSettingsLocked) {
      setIsExpanded(false);
    }
  }

  return (
    <Disclosure
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
      isDisabled={isSettingsLocked}
      className="w-full shrink-0"
    >
      <Disclosure.Heading>
        <TrayMenuButton className="flex justify-between" onPress={() => setIsExpanded(!isExpanded)}>
          <span className="flex items-center gap-3">
            <FaClock className="text-muted" />
            <span>{presetsLabel}</span>
          </span>

          <Disclosure.Indicator className="text-muted" />
        </TrayMenuButton>
      </Disclosure.Heading>

      <Disclosure.Content>
        <Disclosure.Body>
          <Toolbar
            orientation="horizontal"
            className="flex w-full flex-wrap"
            aria-label={presetsLabel}
          >
            {presets.map(preset => (
              <Button
                key={preset.seconds}
                variant="secondary"
                size="sm"
                isDisabled={isSettingsLocked}
                onPress={() => {
                  typedEmit('tray-preset-selected', preset.seconds);
                  setIsExpanded(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </Toolbar>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
};
