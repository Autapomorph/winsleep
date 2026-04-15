import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { cn, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react';
import type { IconType } from 'react-icons';
import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa6';

import { type Theme, TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_DEFAULT } from '@/shared/config';

export const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes: { key: Theme; Icon: IconType; tooltipLabel: string; ariaLabel: string }[] = [
    {
      key: 'light',
      Icon: FaSun,
      tooltipLabel: t(
        $ => $.settings.sections.general.groups.appearance.theme.toggle.tooltip.lightLabel,
      ),
      ariaLabel: t($ => $.settings.sections.general.groups.appearance.theme.toggle.aria.lightLabel),
    },
    {
      key: 'dark',
      Icon: FaMoon,
      tooltipLabel: t(
        $ => $.settings.sections.general.groups.appearance.theme.toggle.tooltip.darkLabel,
      ),
      ariaLabel: t($ => $.settings.sections.general.groups.appearance.theme.toggle.aria.darkLabel),
    },
    {
      key: 'system',
      Icon: FaDesktop,
      tooltipLabel: t(
        $ => $.settings.sections.general.groups.appearance.theme.toggle.tooltip.systemLabel,
      ),
      ariaLabel: t(
        $ => $.settings.sections.general.groups.appearance.theme.toggle.aria.systemLabel,
      ),
    },
  ];

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      selectionMode="single"
      selectedKeys={theme ? [theme] : []}
      onSelectionChange={keys => {
        const nextTheme = Array.from(keys)[0];
        if (nextTheme) {
          setTheme(nextTheme as Theme);
        }
      }}
    >
      {themes.map(({ key, Icon, tooltipLabel, ariaLabel }, idx) => (
        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <ToggleButton key={key} id={key} isIconOnly aria-label={ariaLabel}>
            {idx !== 0 && <ToggleButtonGroup.Separator />}
            <Icon
              className={cn(theme === key ? 'text-field-foreground' : 'text-field-placeholder')}
            />
          </ToggleButton>

          <Tooltip.Content placement="bottom">{tooltipLabel}</Tooltip.Content>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};
