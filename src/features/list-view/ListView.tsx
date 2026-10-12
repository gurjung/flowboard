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
import { DeleteTaskDialog } from '@/components/tasks';
import { useToast } from '@/components/toasts';
import { Status, Task } from '@/domain/types';
import { filterTasksByQuery } from '@/domain/taskSearch';

export interface ListViewProps {
  listId: string;
  canEdit?: boolean;
  onOpenTask?: (taskId: string) => void;
  onOpenCreateTask?: (statusId?: string) => void;
  searchQuery?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  listId,
  canEdit = true,
  onOpenTask,
  onOpenCreateTask: _onOpenCreateTask,
  searchQuery,
}) => {
  const state = useFlowboardStore();
  const toast = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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

  // Pure in-component sorting & search filtering via useMemo (D-053)
  const sortedTasks = useMemo(() => {
    const list = tasksRes.success ? tasksRes.data : [];
    const filtered = filterTasksByQuery(list, searchQuery);
    return sortTasksForListView(filtered, sortConfig, statusesRecord);
  }, [tasksRes, searchQuery, sortConfig, statusesRecord]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((prev) => nextSort(prev, key));
  };

  return (
    <div
      data-testid="task-list-view"
      className="flex flex-1 flex-col h-full min-h-0 overflow-hidden"
    >
      <div className="flex-1 overflow-auto rounded-card border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table
          data-testid="task-list-table"
          className="w-full border-collapse text-left"
        >
          <TaskTableHeader
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
          />

          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {sortedTasks.map((task) => (
              <TaskTableRow
                key={task.id}
                task={task}
                status={statusesRecord[task.statusId]}
                canEdit={canEdit}
                onOpenTask={onOpenTask}
                onDeleteTask={() => setTaskToDelete(task)}
              />
            ))}
          </tbody>
        </table>

        {/* Role-Aware Empty State (F9 Gate 7) */}
        {sortedTasks.length === 0 && (
          <div
            data-testid="empty-list-view"
            className="flex flex-col items-center justify-center p-12 text-center text-xs text-slate-400 dark:text-slate-500"
          >
            {searchQuery?.trim()
              ? `No tasks matching "${searchQuery.trim()}"`
              : canEdit
                ? 'No tasks yet'
                : 'No tasks in this list'}
          </div>
        )}
      </div>

      {/* Delete Task Warning/Confirmation Modal */}
      <DeleteTaskDialog
        isOpen={taskToDelete !== null}
        taskTitle={taskToDelete?.title ?? ''}
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (!taskToDelete) return;
          const res = await state.deleteTask(taskToDelete.id);
          if (res.success) {
            toast.success('Task deleted');
          } else {
            toast.error(res.error.message);
          }
        }}
      />
    </div>
  );
};
