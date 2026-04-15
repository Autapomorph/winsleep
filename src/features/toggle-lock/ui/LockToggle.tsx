import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Kbd, Tooltip } from '@heroui/react';
import { FaLock, FaLockOpen } from 'react-icons/fa6';

import { useSessionStore } from '@/entities/session';
import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_DEFAULT } from '@/shared/config';

export const LockToggle = () => {
  const { t } = useTranslation();
  const { isLocked, toggleLock } = useSessionStore(
    useShallow(state => ({
      isLocked: state.isLocked,
      toggleLock: state.toggleLock,
    })),
  );

  const Icon = isLocked ? FaLock : FaLockOpen;
  const tooltipText = isLocked
    ? t($ => $.timer.lockBtn.tooltip.unlock)
    : t($ => $.timer.lockBtn.tooltip.lock);
  const ariaLabel = t($ => $.timer.lockBtn.aria.label);

  return (
    <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
      <Button
        isIconOnly
        onPress={toggleLock}
        aria-label={ariaLabel}
        variant={isLocked ? 'danger-soft' : 'secondary'}
        className="h-10 w-10"
        aria-keyshortcuts="B"
      >
        <Icon />
      </Button>

      <Tooltip.Content placement="bottom">
        {tooltipText}

        <Kbd className="ml-2" aria-hidden="true">
          <Kbd.Content>B</Kbd.Content>
        </Kbd>
      </Tooltip.Content>
    </Tooltip>
  );
};
