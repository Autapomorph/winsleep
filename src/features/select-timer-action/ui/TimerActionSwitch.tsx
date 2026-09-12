import { useTranslation } from 'react-i18next';
import { cn, Kbd, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react';
import { FaCoffee } from 'react-icons/fa';
import {
  FaArrowsRotate,
  FaLock,
  FaMoon,
  FaPowerOff,
  FaRightFromBracket,
  FaSnowflake,
} from 'react-icons/fa6';

import {
  type TimerAction,
  TOOLTIP_CLOSE_DELAY_DEFAULT,
  TOOLTIP_DELAY_DEFAULT,
} from '@/shared/config';
import { isValidTimerAction } from '@/shared/lib';

interface Props {
  action: TimerAction;
  isLocked?: boolean;
  onActionChange: (action: TimerAction) => void;
}

export const TimerActionSwitch = ({ action, isLocked = false, onActionChange }: Props) => {
  const { t } = useTranslation();

  const getButtonClass = (buttonAction: TimerAction) =>
    cn(
      'h-11 w-12',
      action === buttonAction ? 'bg-accent text-accent-foreground' : 'text-field-placeholder',
    );

  return (
    <div className="flex justify-center">
      <ToggleButtonGroup
        className="p-1"
        selectedKeys={[action]}
        selectionMode="single"
        isDisabled={isLocked}
        onSelectionChange={keys => {
          const selected = Array.from(keys)[0];
          if (isValidTimerAction(selected)) {
            onActionChange(selected);
          }
        }}
      >
        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton id="sleep" className={getButtonClass('sleep')} aria-keyshortcuts="S">
            <FaMoon />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.sleepLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>S</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton
            id="hibernate"
            className={getButtonClass('hibernate')}
            aria-keyshortcuts="H"
          >
            <FaSnowflake />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.hibernateLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>H</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton id="shutdown" className={getButtonClass('shutdown')} aria-keyshortcuts="P">
            <ToggleButtonGroup.Separator />
            <FaPowerOff />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.shutdownLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>P</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton id="reboot" className={getButtonClass('reboot')} aria-keyshortcuts="R">
            <FaArrowsRotate />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.rebootLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>R</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton id="lock" className={getButtonClass('lock')} aria-keyshortcuts="L">
            <ToggleButtonGroup.Separator />
            <FaLock />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.lockLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>L</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton id="signout" className={getButtonClass('signout')} aria-keyshortcuts="Q">
            <FaRightFromBracket />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.signoutLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>Q</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton
            id="keep-awake"
            className={getButtonClass('keep-awake')}
            aria-keyshortcuts="A"
          >
            <ToggleButtonGroup.Separator />
            <FaCoffee />
          </ToggleButton>

          <Tooltip.Content placement="bottom">
            {t($ => $.timerAction.keepAwakeLabel.text)}

            <Kbd className="ml-2" aria-hidden="true">
              <Kbd.Content>A</Kbd.Content>
            </Kbd>
          </Tooltip.Content>
        </Tooltip>
      </ToggleButtonGroup>
    </div>
  );
};
