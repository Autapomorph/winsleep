import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Label, ListBox, Select } from '@heroui/react';

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
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox>
          <ListBox.Item id="sleep" textValue={t($ => $.timerAction.sleepLabel.text)}>
            {t($ => $.timerAction.sleepLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="hibernate" textValue={t($ => $.timerAction.hibernateLabel.text)}>
            {t($ => $.timerAction.hibernateLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="shutdown" textValue={t($ => $.timerAction.shutdownLabel.text)}>
            {t($ => $.timerAction.shutdownLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="reboot" textValue={t($ => $.timerAction.rebootLabel.text)}>
            {t($ => $.timerAction.rebootLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="lock" textValue={t($ => $.timerAction.lockLabel.text)}>
            {t($ => $.timerAction.lockLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>

          <ListBox.Item id="signout" textValue={t($ => $.timerAction.signoutLabel.text)}>
            {t($ => $.timerAction.signoutLabel.text)}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
