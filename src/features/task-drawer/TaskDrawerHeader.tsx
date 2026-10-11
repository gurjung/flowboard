import React from 'react';
import { DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

interface TaskDrawerHeaderProps {
  mode: 'create' | 'edit';
  closeBtnRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
}

export const TaskDrawerHeader: React.FC<TaskDrawerHeaderProps> = ({
  mode,
  closeBtnRef,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
      <div className="w-8 shrink-0" aria-hidden="true" />
      <DialogTitle
        as="h2"
        className="text-base font-semibold text-slate-900 text-center flex-1 dark:text-slate-100"
      >
        {mode === 'create' ? 'Create Task' : 'Edit Task'}
      </DialogTitle>
      <button
        ref={closeBtnRef}
        type="button"
        data-testid="drawer-close-btn"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        aria-label="Close task details"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};
