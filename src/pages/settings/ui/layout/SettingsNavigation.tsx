import { useTranslation } from 'react-i18next';
import { Button, cn, Toolbar, Tooltip } from '@heroui/react';

import { TOOLTIP_CLOSE_DELAY_DEFAULT, TOOLTIP_DELAY_INSTANT } from '@/shared/config';
import { SETTINGS_SECTIONS } from '../../model/navigation';

interface Props {
  activeId: string | null;
  onItemClick: (id: string) => void;
}

export const SettingsNavigation = ({ activeId, onItemClick }: Props) => {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-3 p-2">
      <Toolbar
        orientation="vertical"
        aria-label={t($ => $.settings.title)}
        className="flex flex-col gap-3"
      >
        {SETTINGS_SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeId === section.id;
          const label = t(section.getLabel);

          return (
            <Tooltip
              key={section.id}
              delay={TOOLTIP_DELAY_INSTANT}
              closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}
            >
              <Button
                isIconOnly
                variant={isActive ? 'tertiary' : 'ghost'}
                onPress={() => onItemClick(section.id)}
                className={cn(
                  'transition-transform duration-200',
                  isActive ? 'scale-110 shadow-sm' : 'hover:scale-105',
                )}
                aria-label={label}
              >
                <Icon />
              </Button>

              <Tooltip.Content placement="right" offset={10} showArrow>
                <Tooltip.Arrow />
                {label}
              </Tooltip.Content>
            </Tooltip>
          );
        })}
      </Toolbar>
    </nav>
  );
};
