import { useState } from 'react';
import { Button, Disclosure, Toolbar } from '@heroui/react';
import {
  FaArrowsRotate,
  FaLock,
  FaMoon,
  FaPowerOff,
  FaRightFromBracket,
  FaSnowflake,
} from 'react-icons/fa6';
import { IoMdCheckmark } from 'react-icons/io';

import { type TrayMenuState, typedEmit } from '@/shared/api';
import type { TimerAction } from '@/shared/config';
import { TrayMenuButton } from './TrayMenuButton';

interface Props {
  timerAction: TrayMenuState['timerAction'];
  isSettingsLocked: boolean;
}

export const TimerActionSelector = ({ timerAction, isSettingsLocked }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevIsSettingsLocked, setPrevIsSettingsLocked] = useState(isSettingsLocked);

  if (isSettingsLocked !== prevIsSettingsLocked) {
    setPrevIsSettingsLocked(isSettingsLocked);

    if (isSettingsLocked) {
      setIsExpanded(false);
    }
  }

  const actionsList: { id: TimerAction; label: string }[] = [
    { id: 'sleep', label: timerAction.sleepLabel },
    { id: 'hibernate', label: timerAction.hibernateLabel },
    { id: 'shutdown', label: timerAction.shutdownLabel },
    { id: 'reboot', label: timerAction.rebootLabel },
    { id: 'lock', label: timerAction.lockLabel },
    { id: 'signout', label: timerAction.signoutLabel },
  ];

  const actionIcons = {
    sleep: <FaMoon />,
    hibernate: <FaSnowflake />,
    shutdown: <FaPowerOff />,
    reboot: <FaArrowsRotate />,
    lock: <FaLock />,
    signout: <FaRightFromBracket />,
  };

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
            <span className="text-muted">
              {actionIcons[timerAction.selectedTimerAction as TimerAction]}
            </span>
            <span>{timerAction.selectedTimerActionLabel}</span>
          </span>

          <Disclosure.Indicator className="text-muted" />
        </TrayMenuButton>
      </Disclosure.Heading>

      <Disclosure.Content>
        <Disclosure.Body>
          <Toolbar
            orientation="vertical"
            className="flex w-full flex-col"
            aria-label={timerAction.selectedTimerActionLabel}
          >
            {actionsList.map(action => (
              <Button
                key={action.id}
                variant={timerAction.selectedTimerAction === action.id ? 'secondary' : 'ghost'}
                size="sm"
                fullWidth
                className="flex justify-start gap-3"
                isDisabled={isSettingsLocked}
                onPress={() => {
                  typedEmit('tray-timer-action-selected', action.id);
                  setIsExpanded(false);
                }}
              >
                <span className="text-muted">{actionIcons[action.id]}</span>
                <span>{action.label}</span>
                {timerAction.selectedTimerAction === action.id && (
                  <span className="ms-auto">
                    <IoMdCheckmark />
                  </span>
                )}
              </Button>
            ))}
          </Toolbar>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
};
