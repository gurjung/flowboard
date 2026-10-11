import { useRef, useEffect } from 'react';

/**
 * Handles capturing trigger focus element and restoring focus upon modal close,
 * falling back to the main region heading if the trigger element was unmounted.
 */
export function useDrawerFocusRestore(isOpen: boolean) {
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
    } else if (triggerElementRef.current) {
      const trigger = triggerElementRef.current;
      triggerElementRef.current = null;
      setTimeout(() => {
        if (trigger && document.contains(trigger)) {
          trigger.focus();
        } else {
          const mainHeading = document.querySelector(
            'main h1'
          ) as HTMLElement | null;
          mainHeading?.focus();
        }
      }, 0);
    }
  }, [isOpen]);
}
