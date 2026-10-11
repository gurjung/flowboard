import React from 'react';
import { Task, Status } from '@/domain/types';
import { formatDueDate } from '@/domain/dueDate';
import {
  PriorityBadge,
  StatusBadge,
  UserAvatarGroup,
} from '@/components/tasks';
import { Calendar, AlertCircle } from 'lucide-react';

export interface TaskTableRowProps {
  task: Task;
  status?: Status | null;
  onOpenTask?: (taskId: string) => void;
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  status,
  onOpenTask,
}) => {
  const formattedDue = formatDueDate(task.dueDate, status?.category ?? 'todo');

  return (
    <tr
      data-testid={`task-row-${task.id}`}
      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
    >
      {/* Title */}
      <td className="py-2.5 pl-4 pr-3 max-w-xs sm:max-w-md">
        <button
          type="button"
          onClick={() => onOpenTask?.(task.id)}
          className="w-full text-left font-medium text-slate-900 text-xs truncate hover:text-brand-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded"
        >
          {task.title}
        </button>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* Due Date */}
      <td className="px-3 py-2.5 whitespace-nowrap text-xs">
        {formattedDue ? (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              formattedDue.isOverdue ? 'text-red-600' : 'text-slate-600'
            }`}
          >
            {formattedDue.isOverdue ? (
              <AlertCircle className="h-3 w-3 text-red-500" />
            ) : (
              <Calendar className="h-3 w-3 text-slate-400" />
            )}
            {formattedDue.label}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Assignees */}
      <td className="py-2.5 pl-3 pr-4 whitespace-nowrap">
        <UserAvatarGroup assigneeIds={task.assigneeIds} />
      </td>
    </tr>
  );
};
