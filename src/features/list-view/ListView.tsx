import React, { useState, useMemo } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { selectTasksForList, selectStatusesForList } from '@/domain/selectors';
import {
  sortTasksForListView,
  nextSort,
  SortConfig,
  SortKey,
} from '@/domain/taskSorting';
import { TaskTableHeader } from './TaskTableHeader';
import { TaskTableRow } from './TaskTableRow';
import { QuickTaskInput } from '@/components/tasks';
import { Plus } from 'lucide-react';
import { Status } from '@/domain/types';

export interface ListViewProps {
  listId: string;
  canEdit?: boolean;
  onOpenTask?: (taskId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  listId,
  canEdit = true,
  onOpenTask,
}) => {
  const state = useFlowboardStore();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const tasksRes = selectTasksForList(state, listId);
  const statusesRes = selectStatusesForList(state, listId);

  // Map of statuses by ID for fast lookup
  const statusesRecord = useMemo(() => {
    const list = statusesRes.success ? statusesRes.data : [];
    return list.reduce<Record<string, Status>>((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});
  }, [statusesRes]);

  // Default todo status for inline task creation
  const defaultTodoStatus = useMemo(() => {
    const list = statusesRes.success ? statusesRes.data : [];
    const todoStatuses = list.filter((s) => s.category === 'todo');
    return todoStatuses.sort((a, b) => a.position - b.position)[0] ?? list[0];
  }, [statusesRes]);

  // Pure in-component sorting via useMemo (D-053)
  const sortedTasks = useMemo(() => {
    const list = tasksRes.success ? tasksRes.data : [];
    return sortTasksForListView(list, sortConfig, statusesRecord);
  }, [tasksRes, sortConfig, statusesRecord]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((prev) => nextSort(prev, key));
  };

  return (
    <div
      data-testid="task-list-view"
      className="flex flex-1 flex-col h-full min-h-0 overflow-hidden"
    >
      <div className="flex-1 overflow-auto rounded-card border border-slate-200 bg-white">
        <table
          data-testid="task-list-table"
          className="w-full border-collapse text-left"
        >
          <TaskTableHeader
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
          />

          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedTasks.map((task) => (
              <TaskTableRow
                key={task.id}
                task={task}
                status={statusesRecord[task.statusId]}
                onOpenTask={onOpenTask}
              />
            ))}
          </tbody>
        </table>

        {/* Role-Aware Empty State (F9 Gate 7) */}
        {sortedTasks.length === 0 && !isAdding && (
          <div
            data-testid="empty-list-view"
            className="flex flex-col items-center justify-center p-12 text-center text-xs text-slate-400"
          >
            {canEdit ? 'No tasks yet' : 'No tasks in this list'}
          </div>
        )}
      </div>

      {/* Inline Quick Add Footer (F9 Gate 6) */}
      {canEdit && defaultTodoStatus && (
        <div className="mt-3 shrink-0">
          {isAdding ? (
            <QuickTaskInput
              listId={listId}
              statusId={defaultTodoStatus.id}
              onClose={() => setIsAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              data-testid="list-add-task-btn"
              className="inline-flex items-center gap-1.5 rounded-card border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-subtle hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
};
