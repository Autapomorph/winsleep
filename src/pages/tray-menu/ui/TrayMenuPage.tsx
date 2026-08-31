import { useEffect, useLayoutEffect, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { cn, Separator } from '@heroui/react';
import { FaLock, FaLockOpen, FaMinus, FaPause, FaPlay, FaPlus, FaStop } from 'react-icons/fa6';
import { IoSyncOutline } from 'react-icons/io5';
import { MdOutlineLaunch, MdPowerSettingsNew } from 'react-icons/md';

import { type TrayMenuState, typedEmit, typedListen } from '@/shared/api';
import { TimerActionSelector } from './TimerActionSelector';
import { TimerPresetSelector } from './TimerPresetSelector';
import { TimerStatus } from './TimerStatus';
import { TrayMenuButton } from './TrayMenuButton';

export const TrayMenuPage = () => {
  const [trayState, setTrayState] = useState<TrayMenuState | null>(null);

  const showMainWindow = async () => {
    const main = await WebviewWindow.getByLabel('main');

    if (main) {
      await main.unminimize();
      await main.show();
      await main.setFocus();
    }

    await getCurrentWindow().hide();
  };

  // Set transparent background before paint to prevent flashing/flicker
  useLayoutEffect(() => {
    document.body.classList.remove('bg-background');
    document.body.classList.add('bg-transparent');

    return () => {
      document.body.classList.add('bg-background');
      document.body.classList.remove('bg-transparent');
    };
  }, []);

  // Sync state and listen to focus blur to hide window
  useEffect(() => {
    const unlistenTrayMenuStateUpdatedPromise = typedListen('tray-state-updated', event => {
      setTrayState(event.payload);
    });

    const unlistenWindowFocusChangedPromise = getCurrentWindow().onFocusChanged(
      ({ payload: isFocused }) => {
        if (!isFocused) {
          getCurrentWindow().hide();
        }
      },
    );

    // Request immediate state sync from main window
    typedEmit('tray-sync-request').catch(() => {});

    return () => {
      unlistenTrayMenuStateUpdatedPromise.then(unlisten => unlisten());
      unlistenWindowFocusChangedPromise.then(unlisten => unlisten());
    };
  }, []);

  // Loader
  if (!trayState) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
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

  const isTimestampMode = timerMode === 'timestamp';

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="flex h-full w-full flex-col gap-1 overflow-y-auto p-1.5">
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
            (timerState === 'running' && isTimestampMode) ||
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
          isDisabled={isSettingsLocked || isTimestampMode}
          onPress={() => typedEmit('tray-timer-increase-clicked')}
        >
          {timerIncreaseLabel}
        </TrayMenuButton>

        {/* Decrease Time */}
        <TrayMenuButton
          icon={<FaMinus />}
          isDisabled={isSettingsLocked || isTimestampMode}
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
  );
};
