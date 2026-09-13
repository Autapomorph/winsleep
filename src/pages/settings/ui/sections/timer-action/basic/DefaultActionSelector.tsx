import type { ReactElement } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Label, ListBox, Select, Separator } from '@heroui/react';
import { FaCoffee } from 'react-icons/fa';
import {
  FaArrowsRotate,
  FaLock,
  FaMoon,
  FaPowerOff,
  FaRightFromBracket,
  FaSnowflake,
} from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import type { TimerAction } from '@/shared/config';

export const DefaultActionSelector = () => {
  const { t } = useTranslation();
  const { defaultTimerAction, shouldRememberSelectedTimerAction, setDefaultTimerAction } =
    useSettingsStore(
      useShallow(state => ({
        defaultTimerAction: state.defaultTimerAction,
        shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
        setDefaultTimerAction: state.setDefaultTimerAction,
      })),
    );

  const actions: Record<TimerAction, { label: string; icon: ReactElement }> = {
    sleep: {
      label: t($ => $.timerAction.sleepLabel.text),
      icon: <FaMoon />,
    },
    hibernate: {
      label: t($ => $.timerAction.hibernateLabel.text),
      icon: <FaSnowflake />,
    },
    shutdown: {
      label: t($ => $.timerAction.shutdownLabel.text),
      icon: <FaPowerOff />,
    },
    reboot: {
      label: t($ => $.timerAction.rebootLabel.text),
      icon: <FaArrowsRotate />,
    },
    lock: {
      label: t($ => $.timerAction.lockLabel.text),
      icon: <FaLock />,
    },
    signout: {
      label: t($ => $.timerAction.signoutLabel.text),
      icon: <FaRightFromBracket />,
    },
    'keep-awake': {
      label: t($ => $.timerAction.keepAwakeLabel.text),
      icon: <FaCoffee />,
    },
  };

  return (
    <Select
      variant="secondary"
      value={defaultTimerAction}
      isDisabled={shouldRememberSelectedTimerAction}
      placeholder={t(
        $ => $.settings.sections.timerAction.groups.basic.defaultTimerAction.select.placeholder,
      )}
      onChange={value => {
        if (value !== null) {
          setDefaultTimerAction(value as TimerAction);
        }
      }}
    >
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.timerAction.groups.basic.defaultTimerAction.select.label)}
      </Label>

      <Select.Trigger className="mt-1">
        <Select.Value>
          {({ state, isPlaceholder, defaultChildren }) => {
            const { selectedItems } = state;

            if (isPlaceholder || selectedItems.length === 0) {
              return defaultChildren;
            }

            const selectedAction: { label: string; icon: ReactElement } | undefined =
              actions[selectedItems[0]?.key as TimerAction];

            if (!selectedAction) {
              return defaultChildren;
            }

            return (
              <div className="flex items-center gap-2">
                {selectedAction.icon}
                <span>{selectedAction.label}</span>
              </div>
            );
          }}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          <ListBox.Item id="sleep" textValue={actions.sleep.label}>
            <FaMoon />
            {actions.sleep.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="hibernate" textValue={actions.hibernate.label}>
            <FaSnowflake />
            {actions.hibernate.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <Separator />

          <ListBox.Item id="shutdown" textValue={actions.shutdown.label}>
            <FaPowerOff />
            {actions.shutdown.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="reboot" textValue={actions.reboot.label}>
            <FaArrowsRotate />
            {actions.reboot.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <Separator />

          <ListBox.Item id="lock" textValue={actions.lock.label}>
            <FaLock />
            {actions.lock.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="signout" textValue={actions.signout.label}>
            <FaRightFromBracket />
            {actions.signout.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <Separator />

          <ListBox.Item id="keep-awake" textValue={actions['keep-awake'].label}>
            <FaCoffee />
            {actions['keep-awake'].label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
