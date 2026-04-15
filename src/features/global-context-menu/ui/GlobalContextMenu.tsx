import { useEffect, useRef, useState } from 'react';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useTranslation } from 'react-i18next';
import { Dropdown, Kbd, Label } from '@heroui/react';
import { TbClipboard, TbCopy, TbScissors, TbSelectAll } from 'react-icons/tb';

import { isEditableElement, isSelectableElement, logger } from '@/shared/lib';

export const GlobalContextMenu = () => {
  const { t } = useTranslation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [isTargetEditable, setIsTargetEditable] = useState(false);
  const [isCopyDisabledState, setIsCopyDisabledState] = useState(true);

  const targetRef = useRef<HTMLElement | null>(null);

  const handleCut = async () => {
    const target = targetRef.current;

    if (!target || !isEditableElement(target)) {
      setIsMenuOpen(false);
      return;
    }

    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const textToCut = target.value.substring(start, end);

    if (textToCut) {
      try {
        await writeText(textToCut);

        const newValue = target.value.substring(0, start) + target.value.substring(end);

        // React tracks input value updates by overriding the element's value setter.
        // We must call the prototype setter directly to trigger React's onChange handlers.
        const nativeValueSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          'value',
        )?.set;

        if (nativeValueSetter) {
          nativeValueSetter.call(target, newValue);
        } else {
          target.value = newValue;
        }

        target.selectionStart = start;
        target.selectionEnd = start;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (err) {
        logger.error(`Failed to cut: ${err}`);
      }
    }

    setIsMenuOpen(false);
  };

  const handleCopy = async () => {
    const target = targetRef.current;

    if (!target) {
      setIsMenuOpen(false);
      return;
    }

    const selection = window.getSelection();
    const selectionText = selection?.toString().trim() ?? '';
    const isTargetInSelection = selection ? selection.containsNode(target, true) : false;
    let textToCopy = isTargetInSelection ? selectionText : '';

    if (!textToCopy && isEditableElement(target)) {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      textToCopy = target.value.substring(start, end);
    }

    if (textToCopy) {
      try {
        await writeText(textToCopy);
      } catch (err) {
        logger.error(`Failed to copy to clipboard: ${err}`);
      }
    }

    setIsMenuOpen(false);
  };

  const handlePaste = async () => {
    const target = targetRef.current;

    if (!target || !isEditableElement(target)) {
      setIsMenuOpen(false);
      return;
    }

    try {
      const pastedText = await readText();
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;

      const newValue = target.value.substring(0, start) + pastedText + target.value.substring(end);

      // React tracks input value updates by overriding the element's value setter.
      // We must call the prototype setter directly to trigger React's onChange handlers.
      const nativeValueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(target),
        'value',
      )?.set;

      if (nativeValueSetter) {
        nativeValueSetter.call(target, newValue);
      } else {
        target.value = newValue;
      }

      target.selectionStart = start + pastedText.length;
      target.selectionEnd = start + pastedText.length;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (err) {
      logger.error(`Failed to paste: ${err}`);
    }

    setIsMenuOpen(false);
  };

  const handleSelectAll = () => {
    const target = targetRef.current;

    if (!target) {
      setIsMenuOpen(false);
      return;
    }

    if (isEditableElement(target)) {
      target.select();
    } else {
      const selection = window.getSelection();
      const range = document.createRange();

      range.selectNodeContents(target);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setIsMenuOpen(false);
  };

  // Listen for the global contextmenu event to intercept the default browser menu
  // and trigger the custom context menu for editable or selectable elements.
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target) {
        return;
      }

      // Determine if there is selected text and if it belongs to the target element.
      const selection = window.getSelection();
      const selectionText = selection?.toString().trim() ?? '';
      const isTargetInSelection = selection ? selection.containsNode(target, true) : false;
      const selectedTextVal = isTargetInSelection ? selectionText : '';

      const isEditable = isEditableElement(target);
      const isSelectable = isSelectableElement(target);

      // Prevent the system's default context menu from showing up.
      e.preventDefault();

      if (isEditable || isSelectable) {
        targetRef.current = target;

        setIsTargetEditable(isEditable);
        setMenuPosition({ x: e.clientX, y: e.clientY });

        // Enable Copy option only if text is highlighted or the input field contains characters.
        let isCopyDisabled = true;
        if (selectedTextVal.length > 0) {
          isCopyDisabled = false;
        } else if (isEditable) {
          const start = target.selectionStart ?? 0;
          const end = target.selectionEnd ?? 0;
          isCopyDisabled = start === end;
        }

        setIsCopyDisabledState(isCopyDisabled);
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Manage closing the non-modal menu on outside clicks, secondary context clicks, or page scrolls.
  useEffect(() => {
    const handleOutsideInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Do not close the menu if the user clicked inside the menu itself.
      if (target?.closest('[role="menu"]')) {
        return;
      }

      setIsMenuOpen(false);
    };

    const handleScroll = () => {
      setIsMenuOpen(false);
    };

    // Use event capturing (true) to intercept interactions before they reach other handlers.
    if (isMenuOpen) {
      window.addEventListener('mousedown', handleOutsideInteraction, true);
      window.addEventListener('contextmenu', handleOutsideInteraction, true);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('mousedown', handleOutsideInteraction, true);
      window.removeEventListener('contextmenu', handleOutsideInteraction, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isMenuOpen]);

  return (
    <div
      className="pointer-events-none fixed z-9999 h-0 w-0"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <Dropdown isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Dropdown.Trigger />

        <Dropdown.Popover placement="bottom start" shouldFlip isNonModal>
          <Dropdown.Menu aria-label={t($ => $.common.contextMenu.aria.label)}>
            {isTargetEditable && (
              <Dropdown.Item
                id="cut"
                textValue={t($ => $.common.contextMenu.cut)}
                isDisabled={isCopyDisabledState}
                onAction={handleCut}
                aria-keyshortcuts="Control+X"
              >
                <TbScissors className="size-4 shrink-0 text-muted" />
                <Label>{t($ => $.common.contextMenu.cut)}</Label>
                <Kbd slot="keyboard" variant="light" className="ms-auto">
                  <Kbd.Abbr title="Ctrl+X" keyValue="command" />
                  <Kbd.Content>X</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            )}

            <Dropdown.Item
              id="copy"
              textValue={t($ => $.common.contextMenu.copy)}
              isDisabled={isCopyDisabledState}
              onAction={handleCopy}
              aria-keyshortcuts="Control+C"
            >
              <TbCopy className="size-4 shrink-0 text-muted" />
              <Label>{t($ => $.common.contextMenu.copy)}</Label>
              <Kbd slot="keyboard" variant="light" className="ms-auto">
                <Kbd.Abbr title="Ctrl+C" keyValue="command" />
                <Kbd.Content>C</Kbd.Content>
              </Kbd>
            </Dropdown.Item>

            {isTargetEditable && (
              <Dropdown.Item
                id="paste"
                textValue={t($ => $.common.contextMenu.paste)}
                onAction={handlePaste}
                aria-keyshortcuts="Control+V"
              >
                <TbClipboard className="size-4 shrink-0 text-muted" />
                <Label>{t($ => $.common.contextMenu.paste)}</Label>
                <Kbd slot="keyboard" variant="light" className="ms-auto">
                  <Kbd.Abbr title="Ctrl+V" keyValue="command" />
                  <Kbd.Content>V</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            )}

            <Dropdown.Item
              id="selectAll"
              textValue={t($ => $.common.contextMenu.selectAll)}
              onAction={handleSelectAll}
              aria-keyshortcuts="Control+A"
            >
              <TbSelectAll className="size-4 shrink-0 text-muted" />
              <Label>{t($ => $.common.contextMenu.selectAll)}</Label>
              <Kbd slot="keyboard" variant="light" className="ms-auto">
                <Kbd.Abbr title="Ctrl+A" keyValue="command" />
                <Kbd.Content>A</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
};
