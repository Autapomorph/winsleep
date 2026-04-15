import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTranslation } from 'react-i18next';
import { cn, Dropdown, Separator } from '@heroui/react';
import { TbSquareRoundedChevronDown } from 'react-icons/tb';

import { ViewChangelog } from './items/ChangelogMenuItem';
import { FeatureRequest } from './items/FeatureRequest';
import { ReportIssue } from './items/ReportIssue';
import { CheckUpdates } from './items/UpdateMenuItem';
import { TitlebarButton } from '../TitlebarButton';

export const Menu = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let unlistenPromise: Promise<() => void> | undefined;
    let initialPosition: { x: number; y: number } | null = null;

    // Closes the menu if the user clicks outside the dropdown popover.
    // Works in combination with `pointer-events-none` on the trigger button during open state
    // to prevent the click from instantly reopening the menu.
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const popover = document.querySelector('[data-slot="dropdown-popover"]');

      if (!popover?.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Fetch the initial window position to compare against move event coordinates
      getCurrentWindow()
        .outerPosition()
        .then(position => {
          initialPosition = position;
        });

      window.addEventListener('pointerdown', handlePointerDown, true);

      // Close the menu if the user drags the window.
      // Comparing actual window positions prevents false positives (micro-movements)
      // fired by the OS immediately upon menu focus/activation.
      unlistenPromise = getCurrentWindow().listen<{ x: number; y: number }>(
        'tauri://move',
        event => {
          const { x, y } = event.payload;

          if (!initialPosition) {
            initialPosition = event.payload;
            return;
          }

          if (x !== initialPosition.x || y !== initialPosition.y) {
            setIsOpen(false);
          }
        },
      );
    }

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      unlistenPromise?.then(unlisten => unlisten());
    };
  }, [isOpen]);

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <TitlebarButton
        className={cn(isOpen && 'pointer-events-none')}
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        aria-label={t($ => $.titlebar.menu.menuBtn.aria.label)}
      >
        <TbSquareRoundedChevronDown fontSize={20} />
      </TitlebarButton>

      <Dropdown.Popover placement="bottom">
        <Dropdown.Menu>
          <ReportIssue />
          <FeatureRequest />

          <Separator />

          <ViewChangelog />
          <CheckUpdates />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
