import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to track the active section based on scroll position.
 * It uses IntersectionObserver for high performance and includes a manual override
 * mechanism to prevent "flashing" active states during smooth scrolling.
 *
 * @param ids - List of section IDs to track. Must be memoized to avoid re-initializing the observer.
 * @param offset - Offset from the top of the viewport (in pixels) for the detection zone.
 * @param root - Ref to the scroll container. If null, the browser viewport is used.
 *
 * @returns A tuple [activeId, setManualActiveId]
 * - activeId: The ID of the currently active section.
 * - setManualActiveId: Function to manually set the active section (e.g. on click) and lock it until scroll finishes.
 */
export const useScrollSpy = (
  ids: string[],
  offset = 100,
  root: RefObject<HTMLElement | null> | null = null,
) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * Ref to track if we are in "manual selection" mode.
   * While this is set, automatic IntersectionObserver updates are ignored
   * to prevent flickering when scrolling through multiple sections.
   */
  const manualSelectionRef = useRef<string | null>(null);

  /**
   * Ref for the safety timeout to unlock manual selection mode.
   */
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    /**
     * Handler for IntersectionObserver entries.
     * It finds the most prominent intersecting element and updates the state.
     */
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Skip updates if the user just clicked a navigation item
      if (manualSelectionRef.current) {
        return;
      }

      // Filter and sort intersecting elements to find the one closest to the top of the zone
      const intersecting = entries
        .filter(entry => entry.isIntersecting)
        .sort(
          (a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top,
        );

      if (intersecting.length > 0) {
        setActiveId(intersecting[0].target.id);
      }
    };

    /**
     * Observer configuration.
     * We create a detection zone starting from 'offset' at the top down to 80% of the viewport.
     */
    const observerOptions: IntersectionObserverInit = {
      root: root?.current ?? null,
      rootMargin: `-${offset}px 0px -80% 0px`,
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe all registered section elements
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    /**
     * Manual scrolling detection.
     * If the user starts scrolling with the wheel or touch, we immediately
     * cancel any manual "locks" so the UI becomes responsive to manual input again.
     */
    const scrollContainer = root?.current ?? window;
    const cancelManual = () => {
      manualSelectionRef.current = null;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    scrollContainer.addEventListener('wheel', cancelManual, { passive: true });
    scrollContainer.addEventListener('touchstart', cancelManual, { passive: true });

    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener('wheel', cancelManual);
      scrollContainer.removeEventListener('touchstart', cancelManual);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ids, offset, root]);

  /**
   * Sets the active section manually and locks it.
   * The lock is released either when the 'scrollend' event fires
   * or after a safety timeout (2 seconds).
   *
   * @param id - The ID of the section to set as active.
   */
  const setManualActiveId = (id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    manualSelectionRef.current = id;
    setActiveId(id);

    const scrollContainer = root?.current ?? window;

    const onScrollEnd = () => {
      manualSelectionRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // 'scrollend' is fired when the smooth scroll animation finishes
    scrollContainer.addEventListener('scrollend', onScrollEnd, { once: true });

    // Safety fallback in case 'scrollend' never fires (e.g. element already in view)
    timeoutRef.current = window.setTimeout(() => {
      manualSelectionRef.current = null;
      scrollContainer.removeEventListener('scrollend', onScrollEnd);
    }, 2000);
  };

  return [activeId, setManualActiveId] as const;
};
