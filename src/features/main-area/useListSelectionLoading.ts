import { useState, useEffect, useRef } from 'react';

export function useListSelectionLoading(
  selectedListId: string | null,
  delayMs = 150
): boolean {
  const [isLoading, setIsLoading] = useState(false);
  const requestCounterRef = useRef(0);

  useEffect(() => {
    if (selectedListId === null || delayMs <= 0) {
      setIsLoading(false);
      return;
    }

    // Increment request counter on each list selection (D-029)
    const currentRequestId = ++requestCounterRef.current;
    setIsLoading(true);

    const timer = setTimeout(() => {
      // Clear loading only if this timer is still the latest request
      if (requestCounterRef.current === currentRequestId) {
        setIsLoading(false);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [selectedListId, delayMs]);

  return isLoading;
}
