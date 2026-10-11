import { useState, useEffect } from 'react';

export function useInitialLoading(delayMs = 150): boolean {
  const [isInitialLoading, setIsInitialLoading] = useState(delayMs > 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setIsInitialLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return isInitialLoading;
}
