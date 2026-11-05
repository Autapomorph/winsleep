import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { cn, Separator } from '@heroui/react';
import {
  FaClock,
  FaLock,
  FaLockOpen,
  FaMinus,
  FaPause,
  FaPlay,
  FaPlus,
  FaStop,
} from 'react-icons/fa6';
import { IoSyncOutline } from 'react-icons/io5';
import { MdOutlineLaunch, MdPowerSettingsNew } from 'react-icons/md';

import { type TrayMenuState, typedEmit, typedListen } from '@/shared/api';
import { TRAY_MENU_MAX_HEIGHT, TRAY_MENU_MAX_WIDTH, TRAY_MENU_MIN_WIDTH } from '@/shared/config';
import { logger } from '@/shared/lib';
import { TimerActionSelector } from './TimerActionSelector';
import { TimerPresetSelector } from './TimerPresetSelector';
import { TimerStatus } from './TimerStatus';
import { TrayMenuButton } from './TrayMenuButton';

const ANIMATION_DURATION_MS = 150;

export const TrayMenuPage = () => {
  const [trayState, setTrayState] = useState<TrayMenuState | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const latestTrayStateRef = useRef<TrayMenuState | null>(null);
  const isClosingRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const measurerRef = useRef<HTMLDivElement | null>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const closeWithAnimation = useCallback(async () => {
    const currentWindow = getCurrentWindow();
    const isCurrentWindowVisible = await currentWindow.isVisible().catch(() => false);

    if (!isCurrentWindowVisible || isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    isVisibleRef.current = false;
    setIsVisible(false);

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(async () => {
      try {
        await currentWindow.hide();
      } catch (err) {
        logger.error(`Failed to hide tray window: ${err}`);
      } finally {
        isClosingRef.current = false;
        closeTimeoutRef.current = null;
      }
    }, ANIMATION_DURATION_MS);
  }, []);

  const openWithAnimation = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    isClosingRef.current = false;
    isVisibleRef.current = true;

    if (latestTrayStateRef.current) {
      setTrayState(latestTrayStateRef.current);
    }

    setIsVisible(true);
  }, []);

  const showMainWindow = async () => {
    const main = await WebviewWindow.getByLabel('main');

    if (main) {
      await main.unminimize();
      await main.show();
      await main.setFocus();
    }

    closeWithAnimation();
  };

  // Sync window size with content dimensions automatically
  useLayoutEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return undefined;
    }

    const syncSize = async () => {
      const measuredRect = element.getBoundingClientRect();
      const naturalWidth = measurerRef.current
        ? Math.ceil(measurerRef.current.getBoundingClientRect().width)
        : Math.ceil(element.scrollWidth || measuredRect.width);
      // Add a 2px buffer to measuredHeight to prevent fractional-pixel scrollbars
      const measuredHeight = Math.ceil(element.scrollHeight || measuredRect.height) + 2;

      const boundedWidth = Math.min(
        Math.max(naturalWidth, TRAY_MENU_MIN_WIDTH),
        TRAY_MENU_MAX_WIDTH,
      );
      const boundedHeight = Math.min(measuredHeight, TRAY_MENU_MAX_HEIGHT);

      const hasChanged =
        boundedWidth !== lastDimensionsRef.current.width ||
        boundedHeight !== lastDimensionsRef.current.height;

      if (hasChanged && boundedWidth > 0 && boundedHeight > 0) {
        lastDimensionsRef.current = {
          width: boundedWidth,
          height: boundedHeight,
        };

        try {
          await getCurrentWindow().setSize(new LogicalSize(boundedWidth, boundedHeight));
        } catch (err) {
          logger.error(`Failed to resize tray menu window: ${err}`);
        }
      }
    };

    syncSize().catch(() => {});

    const resizeObserver = new ResizeObserver(() => {
      syncSize().catch(() => {});
    });

    resizeObserver.observe(element);

    if (measurerRef.current) {
      resizeObserver.observe(measurerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [trayState]);

  // Set transparent background before paint to prevent flashing/flicker
  useLayoutEffect(() => {
    document.documentElement.classList.add('bg-transparent');
    document.body.classList.remove('bg-background');
    document.body.classList.add('bg-transparent');

    return () => {
      document.documentElement.classList.remove('bg-transparent');
      document.body.classList.add('bg-background');
      document.body.classList.remove('bg-transparent');
    };
  }, []);

  // Sync state and listen to focus blur to hide window
  useEffect(() => {
    const unlistenTrayMenuStateUpdated = typedListen('tray-state-updated', event => {
      latestTrayStateRef.current = event.payload;
      setTrayState(prev => {
        if (isVisibleRef.current || !prev) {
          return event.payload;
        }

        return prev;
      });
    });

    const unlistenWindowFocusChanged = getCurrentWindow().onFocusChanged(
      async ({ payload: isFocused }) => {
        if (!isFocused) {
          closeWithAnimation();
        } else {
          const isWindowVisible = await getCurrentWindow()
            .isVisible()
            .catch(() => false);

          if (isWindowVisible) {
            openWithAnimation();
          }
        }
      },
    );

    const unlistenTrayMenuShow = typedListen('tray-menu-show', () => {
      openWithAnimation();
    });

    const unlistenTrayMenuRequestClose = typedListen('tray-menu-close-request', () => {
      closeWithAnimation();
    });

    // Request immediate state sync from main window
    typedEmit('tray-sync-request').catch(() => {});

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      unlistenTrayMenuStateUpdated.then(unlisten => unlisten()).catch(() => {});
      unlistenWindowFocusChanged.then(unlisten => unlisten()).catch(() => {});
      unlistenTrayMenuShow.then(unlisten => unlisten()).catch(() => {});
      unlistenTrayMenuRequestClose.then(unlisten => unlisten()).catch(() => {});
    };
  }, [closeWithAnimation, openWithAnimation]);

  // Loader
  if (!trayState) {
    return (
      <div
        className={cn(
          'flex h-screen w-screen items-center justify-center bg-background',
          'transition-opacity ease-out',
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
      >
        <IoSyncOutline className="animate-spin text-muted" size="2.5rem" />
      </div>
    );
  }

  const {
    openLabel,
    quitLabel,
    timerAction,
    timerPresets,
    presetsLabel,
    timerState,
    timerMode,
    isExpiring,
    timerStatusLabel,
    startResumePauseTimerLabel,
    cancelTimerLabel,
    timerIncreaseLabel,
    timerDecreaseLabel,
    isSettingsLocked,
    lockSettingsLabel,
    updateLabel,
    updateStatus,
  } = trayState;

  return (
    <div
      className={cn(
        'h-screen w-screen overflow-hidden bg-background',
        'transition-opacity ease-out',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ transitionDuration: `${ANIMATION_DURATION_MS}ms` }}
    >
      <div className="h-full w-full overflow-x-hidden overflow-y-auto">
        <div ref={contentRef} className="flex h-fit w-full flex-col gap-1 p-1.5">
          {/* Open */}
          <TrayMenuButton icon={<MdOutlineLaunch />} onPress={showMainWindow}>
            {openLabel}
          </TrayMenuButton>

          <Separator className="shrink-0" />

          {/* Timer Action (Expandable) */}
          <TimerActionSelector timerAction={timerAction} isSettingsLocked={isSettingsLocked} />

          {/* Presets (Expandable) */}
          <TimerPresetSelector
            presets={timerPresets}
            presetsLabel={presetsLabel}
            isSettingsLocked={isSettingsLocked}
          />

          <Separator className="shrink-0" />

          {/* Status (Information item) */}
          <TimerStatus
            timerState={timerState}
            isExpiring={isExpiring}
            timerStatusLabel={timerStatusLabel}
          />

          {/* Timer Control: Start / Pause / Resume */}
          <TrayMenuButton
            icon={timerState === 'running' ? <FaPause /> : <FaPlay />}
            isDisabled={
              (timerState === 'running' && timerMode !== 'duration') ||
              (timerState !== 'idle' && isSettingsLocked)
            }
            onPress={() => typedEmit('tray-timer-start-resume-pause-clicked')}
          >
            {startResumePauseTimerLabel}
          </TrayMenuButton>

          {/* Timer Control: Cancel */}
          <TrayMenuButton
            icon={<FaStop />}
            isDisabled={timerState === 'idle' || isSettingsLocked}
            onPress={() => typedEmit('tray-timer-cancel-clicked')}
          >
            {cancelTimerLabel}
          </TrayMenuButton>

          {/* Increase Time */}
          <TrayMenuButton
            icon={<FaPlus />}
            isDisabled={isSettingsLocked || timerMode !== 'duration'}
            onPress={() => typedEmit('tray-timer-increase-clicked')}
          >
            {timerIncreaseLabel}
          </TrayMenuButton>

          {/* Decrease Time */}
          <TrayMenuButton
            icon={<FaMinus />}
            isDisabled={isSettingsLocked || timerMode !== 'duration'}
            onPress={() => typedEmit('tray-timer-decrease-clicked')}
          >
            {timerDecreaseLabel}
          </TrayMenuButton>

          <Separator className="shrink-0" />

          {/* Lock Settings */}
          <TrayMenuButton
            icon={isSettingsLocked ? <FaLock /> : <FaLockOpen />}
            onPress={() => typedEmit('tray-settings-lock-toggle-clicked')}
          >
            {lockSettingsLabel}
          </TrayMenuButton>

          <Separator className="shrink-0" />

          {/* Check for Updates */}
          <TrayMenuButton
            icon={<IoSyncOutline className={cn(updateStatus === 'checking' && 'animate-spin')} />}
            onPress={() => typedEmit('tray-update-clicked')}
          >
            {updateLabel}
          </TrayMenuButton>

          <Separator className="shrink-0" />

          {/* Quit */}
          <TrayMenuButton
            icon={<MdPowerSettingsNew />}
            onPress={() => typedEmit('app-exit-requested')}
          >
            {quitLabel}
          </TrayMenuButton>
        </div>
      </div>

      {/* Invisible off-screen measurer to compute natural unconstrained width */}
      <div
        ref={measurerRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex w-max flex-col gap-1 p-1.5"
      >
        <TrayMenuButton disableTruncate icon={<MdOutlineLaunch />}>
          {openLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate>
          <span className="flex items-center gap-3">
            <span className="text-muted" />
            <span>{timerAction.selectedTimerActionLabel}</span>
          </span>
        </TrayMenuButton>
        <TrayMenuButton disableTruncate>
          <span className="flex items-center gap-3">
            <FaClock className="text-muted" />
            <span>{presetsLabel}</span>
          </span>
        </TrayMenuButton>
        <div className="mx-1.5 my-0.5 px-3 py-2 text-sm font-semibold whitespace-nowrap">
          {timerStatusLabel}
        </div>
        <TrayMenuButton disableTruncate icon={<FaPlay />}>
          {startResumePauseTimerLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<FaStop />}>
          {cancelTimerLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<FaPlus />}>
          {timerIncreaseLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<FaMinus />}>
          {timerDecreaseLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<FaLock />}>
          {lockSettingsLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<IoSyncOutline />}>
          {updateLabel}
        </TrayMenuButton>
        <TrayMenuButton disableTruncate icon={<MdPowerSettingsNew />}>
          {quitLabel}
        </TrayMenuButton>
      </div>
    </div>
  );
};
