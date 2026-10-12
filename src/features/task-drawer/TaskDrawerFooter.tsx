import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ERROR_MESSAGES, UI_LABELS } from '@/constants';

interface TaskDrawerFooterProps {
  mode: 'create' | 'edit';
  canEdit: boolean;
  createdAt?: string;
  taskTitle?: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => Promise<boolean>;
}

export const TaskDrawerFooter: React.FC<TaskDrawerFooterProps> = ({
  mode,
  canEdit,
  createdAt,
  taskTitle,
  isSaving,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const success = await onDelete();
      if (!success) {
        setDeleteError(ERROR_MESSAGES.DELETE_TASK_FAILED);
      }
    } catch {
      setDeleteError('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900">
      {isConfirmingDelete ? (
        <div
          data-testid="drawer-delete-confirm-panel"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-2.5 dark:border-rose-900/60 dark:bg-rose-950/40"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5 dark:text-rose-400" />
            <div className="text-xs text-rose-800 dark:text-rose-300">
              <p className="font-semibold mb-0.5">Delete this task?</p>
              <p className="text-slate-600 truncate max-w-[18rem] dark:text-slate-300">
                &quot;{taskTitle}&quot;
              </p>
            </div>
          </div>

          {deleteError && (
            <p className="text-xs text-rose-700 font-medium dark:text-rose-400">
              {deleteError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsConfirmingDelete(false);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="drawer-confirm-delete-btn"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              data-testid="drawer-delete-btn"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Task</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              {createdAt && `Created ${formatTimestamp(createdAt)}`}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="drawer-cancel-btn"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {UI_LABELS.CANCEL}
            </button>
            <button
              type="button"
              data-testid="drawer-save-btn"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving
                ? 'Saving...'
                : mode === 'create'
                  ? UI_LABELS.CREATE_TASK
                  : UI_LABELS.SAVE_CHANGES}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
