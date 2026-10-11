import React, { useRef, useEffect } from 'react';
import { ToastStore } from './types';
import { createToastStore } from './toastStore';
import { ToastContext } from './ToastContext';
import { useFlowboardStore } from '@/store/useFlowboardStore';

interface ToastProviderProps {
  children: React.ReactNode;
  toastStore?: ToastStore;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  toastStore,
}) => {
  // Use injected instance or create a local stable instance for the tree
  const storeRef = useRef<ToastStore>(toastStore ?? createToastStore());
  if (toastStore && storeRef.current !== toastStore) {
    storeRef.current = toastStore;
  }

  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const prevUserIdRef = useRef(currentUserId);

  // Clear all toasts on ANY current-user change (D-032 / Rule 2)
  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      storeRef.current.clearAll();
    }
  }, [currentUserId]);

  return (
    <ToastContext.Provider value={storeRef.current}>
      {children}
    </ToastContext.Provider>
  );
};
