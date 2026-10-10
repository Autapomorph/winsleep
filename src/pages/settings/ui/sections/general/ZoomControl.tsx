import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Button, Label, Tooltip } from '@heroui/react';
import { FaMinus, FaPlus } from 'react-icons/fa6';

import { useSettingsStore } from '@/entities/setting';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  TOOLTIP_CLOSE_DELAY_DEFAULT,
  TOOLTIP_DELAY_DEFAULT,
} from '@/shared/config';
import { formatZoomPercentage } from '@/shared/lib';

export const ZoomControl = () => {
  const { t } = useTranslation();
  const { zoomFactor, zoomIn, zoomOut } = useSettingsStore(
    useShallow(state => ({
      zoomFactor: state.zoomFactor,
      zoomIn: state.zoomIn,
      zoomOut: state.zoomOut,
    })),
  );

  const isMinReached = zoomFactor <= MIN_ZOOM;
  const isMaxReached = zoomFactor >= MAX_ZOOM;

  return (
    <div className="flex w-full items-center justify-between">
      <Label className="text-sm font-medium">
        {t($ => $.settings.sections.general.groups.appearance.zoom.title)}
      </Label>

      <div className="flex items-center gap-2">
        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <Button
            isIconOnly
            size="sm"
            variant="outline"
            onPress={zoomOut}
            isDisabled={isMinReached}
            aria-label={t($ => $.settings.sections.general.groups.appearance.zoom.zoomOutAria)}
          >
            <FaMinus />
          </Button>

          <Tooltip.Content placement="bottom">
            {t($ => $.settings.sections.general.groups.appearance.zoom.zoomOutAria)}
          </Tooltip.Content>
        </Tooltip>

        <span className="min-w-14 text-center font-mono text-sm font-semibold tabular-nums">
          {formatZoomPercentage(zoomFactor)}
        </span>

        <Tooltip delay={TOOLTIP_DELAY_DEFAULT} closeDelay={TOOLTIP_CLOSE_DELAY_DEFAULT}>
          <Button
            isIconOnly
            size="sm"
            variant="outline"
            onPress={zoomIn}
            isDisabled={isMaxReached}
            aria-label={t($ => $.settings.sections.general.groups.appearance.zoom.zoomInAria)}
          >
            <FaPlus />
          </Button>

          <Tooltip.Content placement="bottom">
            {t($ => $.settings.sections.general.groups.appearance.zoom.zoomInAria)}
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
};
