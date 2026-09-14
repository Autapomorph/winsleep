import { type RefObject, useEffect, useState } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  enabled?: boolean;
}

export const useIntersectionObserver = (
  targetRef: RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {},
): boolean => {
  const { enabled = true, root = null, rootMargin = '0px', threshold = 0 } = options;
  const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';
  const [isIntersecting, setIsIntersecting] = useState(!hasIntersectionObserver);

  useEffect(() => {
    if (!enabled || !hasIntersectionObserver) {
      return undefined;
    }

    const element = targetRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { root, rootMargin, threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, enabled, hasIntersectionObserver, root, rootMargin, threshold]);

  if (!hasIntersectionObserver) {
    return true;
  }

  return enabled ? isIntersecting : false;
};
