import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip } from '@heroui/react';
import { IoIosBug } from 'react-icons/io';

import {
  config,
  SHORTCUTS,
  TOOLTIP_CLOSE_DELAY_DEFAULT,
  TOOLTIP_DELAY_DEFAULT,
} from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

export const CrashTestButton = () => {
  const { t } = useTranslation();
  const [shouldCrash, setShouldCrash] = useState(false);

  useAppHotkey(
    SHORTCUTS.DEV.CRASH_TEST,
    () => {
      setShouldCrash(true);
    },
    {
      enabled: config.isDev,
    },
  );

  if (shouldCrash) {
    throw new Error('Test crash triggered from CrashTestButton');
  }

  return (
    <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
      <Button
        variant="danger-soft"
        isIconOnly
        onPress={() => setShouldCrash(true)}
        aria-label={t($ => $.common.errors.crashTest.button.aria.label)}
      >
        <IoIosBug />
      </Button>

      <Tooltip.Content placement="bottom">
        {t($ => $.common.errors.crashTest.tooltip)}
      </Tooltip.Content>
    </Tooltip>
  );
};
