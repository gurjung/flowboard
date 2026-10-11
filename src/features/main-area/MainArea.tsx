import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { selectCurrentList } from '@/domain/selectors';
import { useListSelectionLoading } from '@/components/main-area/useListSelectionLoading';
import { AccessDeniedScreen } from './AccessDeniedScreen';
import { Inbox, ListFilter } from 'lucide-react';

export const MainArea: React.FC = () => {
  const state = useFlowboardStore();
  const selectedListId = useFlowboardStore((s) => s.selectedListId);
  const currentListResult = selectCurrentList(state);
  const isLoading = useListSelectionLoading(selectedListId, 150);

  // 1. Neutral empty state when selectedListId is null
  if (selectedListId === null) {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center text-slate-500"
        data-testid="no-list-selected"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-700">
          Select a list
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Choose a list from the sidebar to view sprint tasks and workflows.
        </p>
      </main>
    );
  }

  // 2. Stale or invalid selection (FORBIDDEN, CONFLICT, NOT_FOUND, VALIDATION)
  if (!currentListResult.success) {
    return (
      <main className="flex flex-1 bg-white p-6" data-testid="empty-main-area">
        {isLoading && (
          <div className="space-y-3" data-testid="main-area-skeleton">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          </div>
        )}
        <AccessDeniedScreen code={currentListResult.error.code} />
      </main>
    );
  }

  const list = currentListResult.data;
  if (!list) {
    return null;
  }

  // 3. Valid selected list view (isLoading is cosmetic, never gates data!)
  return (
    <main
      className="flex-1 overflow-y-auto bg-white p-6"
      data-testid="main-content"
    >
      {isLoading && (
        <div className="mb-4 space-y-3" data-testid="main-area-skeleton">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        </div>
      )}

      <header className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-indigo-600" />
          <h1
            className="text-xl font-bold tracking-tight text-slate-900"
            data-testid="list-title"
          >
            {list.name}
          </h1>
        </div>
      </header>

      {/* Task & Scaffold Verification Canvas (Preserved for F0 test compatibility) */}
      <section className="mt-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Flowboard Scaffold Test
          </h2>
          <p className="text-xs text-slate-500">
            Verifying Tailwind v4 theme tokens and component setup.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            data-testid="status-todo-card"
            className="rounded-panel border border-status-todo-border bg-status-todo-light p-4 shadow-card"
          >
            <span className="font-semibold text-status-todo">To Do</span>
          </div>
          <div
            data-testid="status-in-progress-card"
            className="rounded-panel border border-status-in_progress-border bg-status-in_progress-light p-4 shadow-card"
          >
            <span className="font-semibold text-status-in_progress">
              In Progress
            </span>
          </div>
          <div
            data-testid="status-done-card"
            className="rounded-panel border border-status-done-border bg-status-done-light p-4 shadow-card"
          >
            <span className="font-semibold text-status-done">Done</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="text-xs font-medium text-priority-urgent">
            Urgent
          </span>
          <span className="text-xs font-medium text-priority-high">High</span>
          <span className="text-xs font-medium text-priority-normal">
            Normal
          </span>
          <span className="text-xs font-medium text-priority-low">Low</span>
          <span className="text-xs font-medium text-priority-none">None</span>
        </div>
      </section>
    </main>
  );
};
