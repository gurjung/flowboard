import React, { useState } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import {
  selectCurrentList,
  selectCanEditCurrentList,
} from '@/domain/selectors';
import { useListSelectionLoading } from '@/components/main-area/useListSelectionLoading';
import { KanbanBoard } from '@/features/kanban';
import { ListView } from '@/features/list-view';
import { TaskDrawer } from '@/features/task-drawer';
import { ViewSwitcher, ActiveView } from './ViewSwitcher';
import { AccessDeniedScreen } from './AccessDeniedScreen';
import { ScaffoldTestCanvas } from './ScaffoldTestCanvas';
import { Inbox, ListFilter } from 'lucide-react';

export const MainArea: React.FC = () => {
  const state = useFlowboardStore();
  const selectedListId = useFlowboardStore((s) => s.selectedListId);
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const [view, setView] = useState<ActiveView>('kanban');
  const [drawerState, setDrawerState] = useState<{
    mode: 'create' | 'edit';
    taskId?: string;
    statusId?: string;
  } | null>(null);
  const currentListResult = selectCurrentList(state);
  const isLoading = useListSelectionLoading(selectedListId, 150);
  const canEdit = selectCanEditCurrentList(state);

  // Clear drawer on ANY current-user change or list change (D-055)
  React.useEffect(() => {
    setDrawerState(null);
  }, [selectedListId, currentUserId]);

  // 1. Neutral empty state when selectedListId is null
  if (selectedListId === null) {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center text-slate-500 dark:bg-slate-950 dark:text-slate-400"
        data-testid="no-list-selected"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Select a list
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Choose a list from the sidebar to view sprint tasks and workflows.
        </p>
      </main>
    );
  }

  // 2. Stale or invalid selection (FORBIDDEN, CONFLICT, NOT_FOUND, VALIDATION)
  if (!currentListResult.success) {
    return (
      <main
        className="flex flex-1 bg-white p-6 dark:bg-slate-950"
        data-testid="empty-main-area"
      >
        {isLoading && (
          <div className="space-y-3" data-testid="main-area-skeleton">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
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
      className="flex flex-1 flex-col overflow-hidden min-h-0 min-w-0 bg-white p-6 dark:bg-slate-950"
      data-testid="main-content"
    >
      {isLoading && (
        <div
          className="mb-4 shrink-0 space-y-3"
          data-testid="main-area-skeleton"
        >
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          {view === 'kanban' ? (
            <div className="flex gap-4">
              <div className="h-48 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
              <div className="h-48 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          ) : (
            <div className="h-32 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
          )}
        </div>
      )}

      <header className="shrink-0 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h1
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
            data-testid="list-title"
          >
            {list.name}
          </h1>
        </div>
        <ViewSwitcher view={view} onViewChange={setView} />
      </header>

      {/* Kanban or List View */}
      <section className="mt-4 flex flex-1 flex-col overflow-hidden min-h-0 min-w-0">
        {view === 'kanban' ? (
          <KanbanBoard
            onOpenTask={(id) => setDrawerState({ mode: 'edit', taskId: id })}
            onOpenCreateTask={(statusId) =>
              setDrawerState({ mode: 'create', statusId })
            }
          />
        ) : (
          <ListView
            listId={list.id}
            canEdit={canEdit}
            key={list.id}
            onOpenTask={(id) => setDrawerState({ mode: 'edit', taskId: id })}
            onOpenCreateTask={(statusId) =>
              setDrawerState({ mode: 'create', statusId })
            }
          />
        )}
      </section>

      {/* Task Detail / Creation Drawer (F10) */}
      <TaskDrawer
        taskId={
          drawerState?.mode === 'edit' ? (drawerState.taskId ?? null) : null
        }
        initialListId={list.id}
        initialStatusId={drawerState?.statusId}
        isOpen={drawerState !== null}
        canEdit={canEdit}
        onClose={() => setDrawerState(null)}
      />

      {/* Task & Scaffold Verification Canvas (Preserved for F0 test compatibility) */}
      <ScaffoldTestCanvas />
    </main>
  );
};
