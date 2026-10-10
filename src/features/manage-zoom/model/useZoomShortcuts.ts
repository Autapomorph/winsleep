import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useSettingsStore } from '@/entities/setting';
import { SHORTCUTS } from '@/shared/config';
import { useAppHotkey } from '@/shared/lib';

export const useZoomShortcuts = () => {
  const { zoomIn, zoomOut, resetZoom } = useSettingsStore(
    useShallow(state => ({
      zoomIn: state.zoomIn,
      zoomOut: state.zoomOut,
      resetZoom: state.resetZoom,
    })),
  );

  useAppHotkey(SHORTCUTS.ZOOM.IN, () => zoomIn());
  useAppHotkey(SHORTCUTS.ZOOM.OUT, () => zoomOut());
  useAppHotkey(SHORTCUTS.ZOOM.RESET, () => resetZoom());

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }

      e.preventDefault();

      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [zoomIn, zoomOut]);
};
