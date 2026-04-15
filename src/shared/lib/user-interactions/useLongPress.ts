import { useCallback, useEffect, useRef } from 'react';

export const useLongPress = (
  callback: () => void,
  delay = 500,
  initialInterval = 350,
  minInterval = 30,
) => {
  const timeoutRef = useRef<number | null>(null);
  const isPressedRef = useRef(false);

  const start = useCallback(() => {
    if (isPressedRef.current) {
      return;
    }

    isPressedRef.current = true;

    callback();

    let currentInterval = initialInterval;

    const tick = () => {
      if (!isPressedRef.current) {
        return;
      }

      callback();
      currentInterval = Math.max(minInterval, currentInterval * 0.9);
      timeoutRef.current = window.setTimeout(tick, currentInterval);
    };

    timeoutRef.current = window.setTimeout(tick, delay);
  }, [callback, delay, initialInterval, minInterval]);

  const clear = useCallback(() => {
    isPressedRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clear;
  }, [clear]);

  return {
    onPressStart: start,
    onPressEnd: clear,
  };
};
