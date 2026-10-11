import React from 'react';
import { DialogTitle } from '@headlessui/react';
import { Status } from '@/domain/types';
import { StatusBadge } from '@/components/tasks';
import { getStatusStyles } from '@/domain/statusColors';
import { X } from 'lucide-react';

interface TaskDrawerHeaderProps {
  mode: 'create' | 'edit';
  title: string;
  titleError?: string | null;
  statusId: string;
  statuses: Status[];
  canEdit: boolean;
  titleInputRef: React.RefObject<HTMLInputElement>;
  closeBtnRef: React.RefObject<HTMLButtonElement>;
  onTitleChange: (title: string) => void;
  onStatusChange: (statusId: string) => void;
  onClose: () => void;
}

export const TaskDrawerHeader: React.FC<TaskDrawerHeaderProps> = ({
  mode,
  title,
  titleError,
  statusId,
  statuses,
  canEdit,
  titleInputRef,
  closeBtnRef,
  onTitleChange,
  onStatusChange,
  onClose,
}) => {
  const currentStatus = statuses.find((s) => s.id === statusId);
  const currentStatusStyles = getStatusStyles(
    currentStatus?.color,
    currentStatus?.category
  );

  return (
    <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <DialogTitle
            as="h2"
            className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400"
          >
            {mode === 'create' ? 'Create Task' : 'Edit Task'}
          </DialogTitle>

          {/* Status Dropdown */}
          {canEdit ? (
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${currentStatusStyles.dot}`}
              />
              <select
                id="drawer-status-select"
                data-testid="drawer-status-select"
                value={statusId}
                onChange={(e) => onStatusChange(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-hidden dark:text-slate-200"
              >
                {statuses.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <StatusBadge status={currentStatus} />
          )}
        </div>

        {/* Close Button */}
        <button
          ref={closeBtnRef}
          type="button"
          data-testid="drawer-close-btn"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close task details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Title Input or Read-Only Heading */}
      {canEdit ? (
        <div>
          <input
            ref={titleInputRef}
            data-testid="drawer-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Task title..."
            className="w-full text-base font-semibold text-slate-900 border border-slate-200 rounded-md px-2.5 py-1.5 hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
          />
          {titleError && (
            <p className="mt-1 text-xs text-rose-600 font-medium pl-1.5 dark:text-rose-400">
              {titleError}
            </p>
          )}
        </div>
      ) : (
        <h3 className="text-lg font-semibold text-slate-900 px-1.5 dark:text-slate-100">
          {title}
        </h3>
      )}
    </div>
  );
};
