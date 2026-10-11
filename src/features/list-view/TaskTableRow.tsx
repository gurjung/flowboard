import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Task, Status } from '@/domain/types';
import { formatDueDate } from '@/domain/dueDate';
import {
  PriorityBadge,
  StatusBadge,
  UserAvatarGroup,
} from '@/components/tasks';
import {
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';

export interface TaskTableRowProps {
  task: Task;
  status?: Status | null;
  canEdit?: boolean;
  onOpenTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  status,
  canEdit = true,
  onOpenTask,
  onDeleteTask,
}) => {
  const formattedDue = formatDueDate(task.dueDate, status?.category ?? 'todo');

  return (
    <tr
      data-testid={`task-row-${task.id}`}
      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/60"
    >
      {/* Title */}
      <td className="py-2.5 pl-4 pr-3 max-w-xs sm:max-w-md">
        <button
          type="button"
          onClick={() => onOpenTask?.(task.id)}
          data-testid={`task-row-title-${task.id}`}
          className="block w-full text-left font-medium text-slate-900 text-xs truncate hover:text-indigo-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded dark:text-slate-100 dark:hover:text-indigo-400"
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
              formattedDue.isOverdue
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-300'
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
          <span className="text-slate-400 dark:text-slate-500">-</span>
        )}
      </td>

      {/* Assignees */}
      <td className="py-2.5 pl-3 pr-3 whitespace-nowrap">
        <UserAvatarGroup assigneeIds={task.assigneeIds} />
      </td>

      {/* Actions */}
      <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap w-12">
        {canEdit && (
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton
              data-testid={`task-actions-${task.id}`}
              className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-hidden dark:hover:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Task actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-20 mt-1 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden dark:bg-slate-800 dark:ring-slate-700">
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => onOpenTask?.(task.id)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 ${
                      focus ? 'bg-slate-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Edit
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => onDeleteTask?.(task.id)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 ${
                      focus ? 'bg-rose-50 dark:bg-rose-950/40' : ''
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                    Delete
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        )}
      </td>
    </tr>
  );
};
