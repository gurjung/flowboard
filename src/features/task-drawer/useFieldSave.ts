import { useState, useRef, useEffect, useCallback } from 'react';

interface UseFieldSaveOptions<T> {
  initialValue: T;
  validate?: (val: T) => string | null;
  onSave: (
    val: T
  ) => Promise<{ success: boolean; error?: { code: string; message: string } }>;
  isEqual?: (a: T, b: T) => boolean;
}

export function useFieldSave<T>({
  initialValue,
  validate,
  onSave,
  isEqual = (a, b) => a === b,
}: UseFieldSaveOptions<T>) {
  const [draft, setDraft] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef<T>(initialValue);
  const isSavingRef = useRef(false);

  // Sync external initialValue if current draft matches lastSaved
  useEffect(() => {
    if (isEqual(draft, lastSavedRef.current)) {
      setDraft(initialValue);
    }
    lastSavedRef.current = initialValue;
  }, [initialValue, isEqual, draft]);

  const commit = useCallback(
    async (valToSave: T = draft): Promise<boolean> => {
      if (isSavingRef.current) return false;
      if (isEqual(valToSave, lastSavedRef.current)) {
        setError(null);
        return true;
      }

      if (validate) {
        const validationError = validate(valToSave);
        if (validationError) {
          setError(validationError);
          return false;
        }
      }

      setError(null);
      isSavingRef.current = true;
      lastSavedRef.current = valToSave;

      try {
        const res = await onSave(valToSave);
        if (!res.success) {
          lastSavedRef.current = initialValue;
          return false;
        }
        return true;
      } finally {
        isSavingRef.current = false;
      }
    },
    [draft, initialValue, isEqual, onSave, validate]
  );

  return {
    draft,
    setDraft,
    error,
    setError,
    commit,
    isDirty: !isEqual(draft, lastSavedRef.current),
  };
}
