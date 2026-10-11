import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { canManageContainers } from '@/domain/permissions';
import { ErrorCode } from '@/domain/result';
import { ShieldAlert, Archive, HelpCircle } from 'lucide-react';

interface AccessDeniedScreenProps {
  code: ErrorCode;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  code,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const users = useFlowboardStore((s) => s.users);
  const clearSelection = useFlowboardStore((s) => s.clearSelection);

  const currentUser = users[currentUserId];
  const isAdmin = canManageContainers(currentUser);

  if (code === 'FORBIDDEN') {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-8 text-center"
        data-testid="access-denied-screen"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-subtle dark:bg-rose-950/40 dark:text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Access Denied
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          You do not have permission to view this list.
        </p>
        <button
          type="button"
          onClick={() => clearSelection()}
          data-testid="clear-selection-btn"
          className="mt-5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear selection
        </button>
      </div>
    );
  }

  if (code === 'CONFLICT') {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-8 text-center"
        data-testid="archived-list-screen"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-subtle dark:bg-amber-950/40 dark:text-amber-400">
          <Archive className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          List is Archived
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          {isAdmin
            ? 'This list or its parent is archived. Restore it from the Archived section in the sidebar to view its contents.'
            : 'This list or its parent is archived and unavailable.'}
        </p>
        <button
          type="button"
          onClick={() => clearSelection()}
          data-testid="clear-selection-btn"
          className="mt-5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear selection
        </button>
      </div>
    );
  }

  // NOT_FOUND or VALIDATION
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-8 text-center"
      data-testid="unavailable-list-screen"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-subtle dark:bg-slate-800 dark:text-slate-400">
        <HelpCircle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        List Unavailable
      </h2>
      <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        This list does not exist or is invalid.
      </p>
      <button
        type="button"
        onClick={() => clearSelection()}
        data-testid="clear-selection-btn"
        className="mt-5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Clear selection
      </button>
    </div>
  );
};
