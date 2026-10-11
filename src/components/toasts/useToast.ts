import { useContext, useSyncExternalStore } from 'react';
import { ToastContext } from './ToastContext';
import { ToastStore, ToastMessage } from './types';

export function useToast(): ToastStore {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useToastMessages(): ToastMessage[] {
  const store = useToast();
  return useSyncExternalStore(
    store.subscribe,
    () => store.toasts,
    () => []
  );
}
