import React, { useState } from 'react';
import { Modal } from '@/components/common';
import { AlertTriangle } from 'lucide-react';

export interface DeleteTaskDialogProps {
  isOpen: boolean;
  taskTitle: string;
  testId?: string;
  confirmTestId?: string;
  cancelTestId?: string;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void>;
}

export const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({
  isOpen,
  taskTitle,
  testId = 'delete-task-dialog',
  confirmTestId = 'delete-task-confirm-btn',
  cancelTestId = 'delete-task-cancel-btn',
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await onConfirm();
      if (res === false) {
        setErrorMsg('Failed to delete task. Please try again.');
        setIsDeleting(false);
      } else {
        setIsDeleting(false);
        onClose();
      }
    } catch {
      setErrorMsg('An unexpected error occurred while deleting.');
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Task"
      testId={testId}
      errorMsg={errorMsg}
    >
      <div className="space-y-3.5">
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Are you sure you want to delete this task?
            </p>
            <p className="mt-1 font-medium text-slate-700 dark:text-slate-200 truncate max-w-xs">
              &quot;{taskTitle}&quot;
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            data-testid={cancelTestId}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            data-testid={confirmTestId}
            className="rounded bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
