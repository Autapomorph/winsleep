import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@heroui/react';

import { useLongPress } from '@/shared/lib';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const itemHeight = 40; // px

  const baseItems = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const items = isInfinite ? [...baseItems, ...baseItems, ...baseItems] : baseItems;

  const isProgrammaticScrollRef = useRef(false);

  const scrollToValue = useCallback(
    (val: number, behavior: ScrollBehavior = 'instant') => {
      const { current: el } = scrollRef;

      if (!el) {
        return;
      }

      const baseIndex = val - min;
      const blockLength = baseItems.length;

      if (isInfinite && behavior === 'smooth') {
        // Current index in the items array
        const currentIndex = value - min + blockLength;

        // Possible target indices (prev, curr, next blocks)
        const targets = [baseIndex, baseIndex + blockLength, baseIndex + blockLength * 2];

        // Find the target closest to the current scroll position
        const bestTarget = targets.reduce((prev, curr) =>
          Math.abs(curr - currentIndex) < Math.abs(prev - currentIndex) ? curr : prev,
        );

        isProgrammaticScrollRef.current = true;
        el.scrollTo({ top: bestTarget * itemHeight, behavior: 'smooth' });
        return;
      }

      const offset = isInfinite ? blockLength : 0;
      isProgrammaticScrollRef.current = true;
      el.scrollTo({ top: (baseIndex + offset) * itemHeight, behavior });

      // For instant scrolls, we can reset almost immediately
      if (behavior === 'instant') {
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 50);
      }
    },
    [min, isInfinite, baseItems.length, value],
  );

  // Sync scroll position with value
  useEffect(() => {
    if (!isScrolling && !isEditing) {
      scrollToValue(value);
    }
  }, [value, isScrolling, isEditing, scrollToValue]);

  const handleScroll = () => {
    const { current: el } = scrollRef;
    if (!el || isEditing || isProgrammaticScrollRef.current) {
      return;
    }

    setIsScrolling(true);

    const { scrollTop } = el;
    const index = Math.round(scrollTop / itemHeight);
    const item = items[index];

    if (item !== undefined && item % (max + 1) !== value % (max + 1)) {
      let newValue = item;

      if (isInfinite) {
        newValue = ((item - min) % baseItems.length) + min;
      }
      onChange(newValue);
    }
  };

  // Handle wheel events on the container
  useEffect(() => {
    const { current: el } = containerRef;

    if (el && !isEditing) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        if (delta === 0) return;

        let newValue = value + delta;
        if (newValue > max) {
          newValue = isInfinite ? min : max;
        } else if (newValue < min) {
          newValue = isInfinite ? max : min;
        }

        if (newValue !== value) {
          onChange(newValue);
          scrollToValue(newValue, 'smooth');
        }
      };

      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
    return undefined;
  }, [value, min, max, isInfinite, onChange, isEditing, scrollToValue]);

  useEffect(() => {
    const { current: el } = scrollRef;

    if (el) {
      const handleScrollEnd = () => {
        setIsScrolling(false);
        isProgrammaticScrollRef.current = false;
        if (isInfinite) {
          const { scrollTop } = el;
          const totalHeight = baseItems.length * itemHeight;
          if (scrollTop < totalHeight - 1) {
            scrollToValue(value, 'instant');
          } else if (scrollTop >= totalHeight * 2 - 1) {
            scrollToValue(value, 'instant');
          }
        }
      };

      el.addEventListener('scrollend', handleScrollEnd);
      return () => el.removeEventListener('scrollend', handleScrollEnd);
    }
    return undefined;
  }, [isInfinite, baseItems.length, value, scrollToValue]);

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
        setInputValue(value.toString());
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
        if (next > max) next = isInfinite ? min : max;
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
        if (next < min) next = isInfinite ? max : min;
        return next;
      });
    }, [min, max, isInfinite, onChange]),
    300,
    350,
    150,
  );

  const handleInputSubmit = () => {
    let num = parseInt(inputValue, 10);
    if (Number.isNaN(num)) num = value;
    num = Math.max(min, Math.min(max, num));
    onChange(num);
    setIsEditing(false);
    // Restore focus to the container
    setTimeout(() => containerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayItems = isInfinite
    ? [
        ...baseItems.map(item => ({ item, key: `prev-${item}` })),
        ...baseItems.map(item => ({ item, key: `curr-${item}` })),
        ...baseItems.map(item => ({ item, key: `next-${item}` })),
      ]
    : baseItems.map(item => ({ item, key: `item-${item}` }));

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
            onChange={e => {
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
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleInputSubmit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(false);
                setTimeout(() => containerRef.current?.focus(), 0);
              }
            }}
            onBlur={handleInputSubmit}
            aria-label={t($ => $.common.wheelPicker.enterValue.aria.label, {
              label: ariaLabel ?? t($ => $.common.wheelPicker.enterValue.value.text),
            })}
          />
        ) : (
          <button
            type="button"
            className="h-full w-full cursor-pointer border-none bg-transparent outline-none hover:bg-default/10"
            tabIndex={-1}
            onClick={() => {
              setIsEditing(true);
              setInputValue(value.toString());
            }}
            aria-label={t($ => $.common.wheelPicker.editValue.aria.label, {
              label: ariaLabel ?? t($ => $.common.wheelPicker.editValue.value.text),
            })}
          />
        )}
      </div>

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
