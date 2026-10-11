import React from 'react';
import { useToastMessages } from './useToast';
import { ToastItem } from './ToastItem';

export const ToastContainer: React.FC = () => {
  const toasts = useToastMessages();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      data-testid="toast-container"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
