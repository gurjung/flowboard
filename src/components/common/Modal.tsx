import React, { useEffect, useRef } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { X, AlertCircle } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  testId?: string;
  errorMsg?: string | null;
  maxWidthClass?: string;
  closeOnUserChange?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  testId,
  errorMsg,
  maxWidthClass = 'max-w-sm',
  closeOnUserChange = true,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const initialUserRef = useRef(currentUserId);

  // Close dialog on ANY user switch (D-029 Rule 8)
  useEffect(() => {
    if (closeOnUserChange && initialUserRef.current !== currentUserId) {
      onClose();
    }
  }, [currentUserId, onClose, closeOnUserChange]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      data-testid={testId}
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] flex flex-col rounded-panel border border-slate-200 bg-white p-5 shadow-modal dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 shrink-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div
            className="mt-3 flex items-start gap-2 rounded bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border dark:border-rose-800 shrink-0"
            data-testid="dialog-error"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
