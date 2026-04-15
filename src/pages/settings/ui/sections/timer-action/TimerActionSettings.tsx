import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Label, ListBox, Select, Switch } from '@heroui/react';

import { useSettingsStore } from '@/entities/setting';
import type { TimerAction } from '@/shared/config';
import { InfoTooltip } from '@/shared/ui';
import { SettingsGroup } from '../../layout/SettingsGroup';

export const TimerActionSettings = () => {
  const { t } = useTranslation();
  const {
    defaultTimerAction,
    shouldRememberSelectedTimerAction,
    setDefaultTimerAction,
    setShouldRememberSelectedTimerAction,
  } = useSettingsStore(
    useShallow(state => ({
      defaultTimerAction: state.defaultTimerAction,
      shouldRememberSelectedTimerAction: state.shouldRememberSelectedTimerAction,
      setDefaultTimerAction: state.setDefaultTimerAction,
      setShouldRememberSelectedTimerAction: state.setShouldRememberSelectedTimerAction,
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground/80">
        {t($ => $.settings.sections.timerAction.title)}
      </h2>

      {/* Group Basic */}
      <SettingsGroup title={t($ => $.settings.sections.timerAction.groups.basic.title)}>
        <div className="flex flex-col gap-4">
          <Switch
            isSelected={shouldRememberSelectedTimerAction}
            onChange={setShouldRememberSelectedTimerAction}
            className="w-full"
          >
            <Switch.Content className="flex w-full items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>
                  {t(
                    $ =>
                      $.settings.sections.timerAction.groups.basic.rememberSelectedTimerAction
                        .switch.label,
                  )}
                </span>

                <InfoTooltip className="break-normal whitespace-normal">
                  {t(
                    $ =>
                      $.settings.sections.timerAction.groups.basic.rememberSelectedTimerAction
                        .tooltip.text,
                  )}
                </InfoTooltip>
              </div>

              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>

          <Select
            variant="secondary"
            value={defaultTimerAction}
            isDisabled={shouldRememberSelectedTimerAction}
            placeholder={t(
              $ =>
                $.settings.sections.timerAction.groups.basic.defaultTimerAction.select.placeholder,
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
        </div>
      </SettingsGroup>
    </div>
  );
};
