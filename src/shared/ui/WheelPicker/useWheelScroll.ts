import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { INSTANT_SCROLL_RESET_DELAY_MS, ITEM_HEIGHT } from './constants';

export interface UseWheelScrollOptions {
  value: number;
  min: number;
  max: number;
  isInfinite: boolean;
  isEditing: boolean;
  onChange: (value: number | ((prev: number) => number)) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export interface WheelItem {
  item: number;
  key: string;
}

export const useWheelScroll = ({
  value,
  min,
  max,
  isInfinite,
  isEditing,
  onChange,
  containerRef,
  scrollRef,
}: UseWheelScrollOptions) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const isProgrammaticScrollRef = useRef(false);

  const baseItems = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [max, min],
  );

  const items = useMemo(
    () => (isInfinite ? [...baseItems, ...baseItems, ...baseItems] : baseItems),
    [baseItems, isInfinite],
  );

  const scrollToValue = useCallback(
    (val: number, behavior: ScrollBehavior = 'instant') => {
      const el = scrollRef.current;

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
        el.scrollTo({ top: bestTarget * ITEM_HEIGHT, behavior: 'smooth' });

        return;
      }

      const offset = isInfinite ? blockLength : 0;

      isProgrammaticScrollRef.current = true;
      el.scrollTo({ top: (baseIndex + offset) * ITEM_HEIGHT, behavior });

      // For instant scrolls, we can reset almost immediately
      if (behavior === 'instant') {
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, INSTANT_SCROLL_RESET_DELAY_MS);
      }
    },
    [min, isInfinite, baseItems.length, value, scrollRef],
  );

  // Sync scroll position with value
  useEffect(() => {
    if (!isScrolling && !isEditing) {
      scrollToValue(value);
    }
  }, [value, isScrolling, isEditing, scrollToValue]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isEditing || isProgrammaticScrollRef.current) {
      return;
    }

    setIsScrolling(true);

    const { scrollTop } = el;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const item = items[index];

    if (item !== undefined && item % (max + 1) !== value % (max + 1)) {
      let newValue = item;

      if (isInfinite) {
        newValue = ((item - min) % baseItems.length) + min;
      }

      onChange(newValue);
    }
  }, [baseItems.length, isEditing, isInfinite, items, max, min, onChange, scrollRef, value]);

  // Handle wheel events on the container
  useEffect(() => {
    const el = containerRef.current;

    if (el && !isEditing) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const delta = Math.sign(e.deltaY);
        if (delta === 0) {
          return;
        }

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
      return () => {
        el.removeEventListener('wheel', handleWheel);
      };
    }
    return undefined;
  }, [containerRef, isEditing, isInfinite, max, min, onChange, scrollToValue, value]);

  // Handle scrollend to reset infinite scrolling position seamlessly
  useEffect(() => {
    const el = scrollRef.current;

    if (el) {
      const handleScrollEnd = () => {
        setIsScrolling(false);
        isProgrammaticScrollRef.current = false;

        if (isInfinite) {
          const { scrollTop } = el;
          const totalHeight = baseItems.length * ITEM_HEIGHT;
          if (scrollTop < totalHeight - 1) {
            scrollToValue(value, 'instant');
          } else if (scrollTop >= totalHeight * 2 - 1) {
            scrollToValue(value, 'instant');
          }
        }
      };

      el.addEventListener('scrollend', handleScrollEnd);

      return () => {
        el.removeEventListener('scrollend', handleScrollEnd);
      };
    }
    return undefined;
  }, [baseItems.length, isInfinite, scrollRef, scrollToValue, value]);

  const displayItems: WheelItem[] = useMemo(() => {
    if (isInfinite) {
      return [
        ...baseItems.map(item => ({ item, key: `prev-${item}` })),
        ...baseItems.map(item => ({ item, key: `curr-${item}` })),
        ...baseItems.map(item => ({ item, key: `next-${item}` })),
      ];
    }
    return baseItems.map(item => ({ item, key: `item-${item}` }));
  }, [baseItems, isInfinite]);

  return {
    displayItems,
    scrollToValue,
    handleScroll,
    isScrolling,
  };
};
