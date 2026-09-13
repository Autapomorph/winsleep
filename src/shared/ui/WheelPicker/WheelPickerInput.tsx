import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: number;
  min: number;
  max: number;
  isEditing: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  ariaLabel?: string;
  onStartEditing: () => void;
  onFinishEditing: (newValue?: number) => void;
}

export const WheelPickerInput = ({
  value,
  min,
  max,
  isEditing,
  containerRef,
  ariaLabel,
  onStartEditing,
  onFinishEditing,
}: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value.toString());
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing);

  if (prevIsEditing !== isEditing) {
    setPrevIsEditing(isEditing);

    if (isEditing) {
      setInputValue(value.toString());
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    let num = parseInt(inputValue, 10);

    if (Number.isNaN(num)) {
      num = value;
    }

    num = Math.max(min, Math.min(max, num));

    onFinishEditing(num);

    setTimeout(() => {
      containerRef.current?.focus();
    }, 0);
  };

  const handleCancel = () => {
    onFinishEditing();

    setTimeout(() => {
      containerRef.current?.focus();
    }, 0);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === '') {
      setInputValue('');
      return;
    }

    const num = parseInt(val, 10);

    if (!Number.isNaN(num)) {
      if (num > max) {
        setInputValue(max.toString());
      } else if (num < min) {
        setInputValue(min.toString());
      } else {
        setInputValue(val);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      handleSubmit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();

      handleCancel();
    }
  };

  return (
    <div
      className={`pointer-events-auto absolute top-1/2 left-0 z-30 h-10 w-full -translate-y-1/2 border-y border-border/50 ${
        isEditing ? 'bg-background' : 'bg-default/5'
      }`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          className="h-full w-full [appearance:textfield] bg-transparent text-center font-mono text-2xl font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={inputValue}
          min={min}
          max={max}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          aria-label={t($ => $.common.wheelPicker.enterValue.aria.label, {
            label: ariaLabel ?? t($ => $.common.wheelPicker.enterValue.value.text),
          })}
        />
      ) : (
        <button
          type="button"
          className="h-full w-full cursor-pointer border-none bg-transparent outline-none hover:bg-default/10"
          tabIndex={-1}
          onClick={onStartEditing}
          aria-label={t($ => $.common.wheelPicker.editValue.aria.label, {
            label: ariaLabel ?? t($ => $.common.wheelPicker.editValue.value.text),
          })}
        />
      )}
    </div>
  );
};
