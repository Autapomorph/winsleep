import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@heroui/react';

import { useLongPress } from '@/shared/lib';
import { useWheelScroll } from './useWheelScroll';
import { WheelPickerInput } from './WheelPickerInput';

interface Props {
  className?: string;
  value: number;
  min: number;
  max: number;
  isInfinite?: boolean;
  ariaLabel?: string;
  onChange: (value: number | ((prev: number) => number)) => void;
}

export const WheelPicker = ({
  className,
  value,
  min,
  max,
  isInfinite = false,
  ariaLabel,
  onChange,
}: Props) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { displayItems, scrollToValue, handleScroll } = useWheelScroll({
    value,
    min,
    max,
    isInfinite,
    isEditing,
    onChange,
    containerRef,
    scrollRef,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      return;
    }

    let newValue = value;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newValue = value + 1;

        if (newValue > max) {
          newValue = isInfinite ? min : max;
        }

        break;

      case 'ArrowDown':
        e.preventDefault();
        newValue = value - 1;

        if (newValue < min) {
          newValue = isInfinite ? max : min;
        }

        break;

      case 'Home':
        e.preventDefault();
        newValue = min;
        break;

      case 'End':
        e.preventDefault();
        newValue = max;
        break;

      case 'Enter':
        e.preventDefault();
        setIsEditing(true);
        return;

      default:
        return;
    }

    if (newValue !== value) {
      onChange(newValue);
      scrollToValue(newValue, 'smooth');
    }
  };

  const incrementPress = useLongPress(
    useCallback(() => {
      onChange(prev => {
        let next = prev + 1;
        if (next > max) {
          next = isInfinite ? min : max;
        }
        return next;
      });
    }, [min, max, isInfinite, onChange]),
    300,
    350,
    150,
  );

  const decrementPress = useLongPress(
    useCallback(() => {
      onChange(prev => {
        let next = prev - 1;
        if (next < min) {
          next = isInfinite ? max : min;
        }
        return next;
      });
    }, [min, max, isInfinite, onChange]),
    300,
    350,
    150,
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'focus-visible:ring-primary/50 relative h-30 w-fit overflow-hidden rounded-xl outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
      )}
      tabIndex={isEditing ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={value.toString().padStart(2, '0')}
    >
      {/* Top Region - Decrement */}
      {!isEditing && (
        <button
          type="button"
          className="absolute inset-x-0 top-0 z-20 h-10 w-full cursor-pointer border-none bg-transparent outline-none"
          tabIndex={-1}
          onMouseDown={decrementPress.onPressStart}
          onMouseUp={decrementPress.onPressEnd}
          onMouseLeave={decrementPress.onPressEnd}
          onTouchStart={decrementPress.onPressStart}
          onTouchEnd={decrementPress.onPressEnd}
          aria-label={t($ => $.common.wheelPicker.decrement.aria.label)}
        />
      )}

      {/* Bottom Region - Increment */}
      {!isEditing && (
        <button
          type="button"
          className="absolute inset-x-0 bottom-0 z-20 h-10 w-full cursor-pointer border-none bg-transparent outline-none"
          tabIndex={-1}
          onMouseDown={incrementPress.onPressStart}
          onMouseUp={incrementPress.onPressEnd}
          onMouseLeave={incrementPress.onPressEnd}
          onTouchStart={incrementPress.onPressStart}
          onTouchEnd={incrementPress.onPressEnd}
          aria-label={t($ => $.common.wheelPicker.increment.aria.label)}
        />
      )}

      {/* Selection Highlight / Edit Target */}
      <WheelPickerInput
        value={value}
        min={min}
        max={max}
        isEditing={isEditing}
        ariaLabel={ariaLabel}
        containerRef={containerRef}
        onStartEditing={() => {
          setIsEditing(true);
        }}
        onFinishEditing={newValue => {
          setIsEditing(false);
          if (newValue !== undefined) {
            onChange(newValue);
          }
        }}
      />

      {/* Scrollable Area */}
      <div
        ref={scrollRef}
        className={`h-full snap-y snap-mandatory scrollbar-none overflow-y-auto py-10 transition-opacity ${
          isEditing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 13%, black 87%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 13%, black 87%, transparent)',
        }}
        onScroll={handleScroll}
      >
        {displayItems.map(({ item, key }) => (
          <div
            key={key}
            className={`flex h-10 snap-center items-center justify-center px-5 font-mono text-2xl font-bold transition-opacity duration-200 ${
              item === value ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {item.toString().padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  );
};
