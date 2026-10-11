import React from 'react';
import { Task, StatusCategory } from '@/domain/types';
import { formatDueDate } from '@/domain/dueDate';
import { PriorityBadge, UserAvatarGroup } from '@/components/tasks';
import { Calendar, AlertCircle } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  statusCategory: StatusCategory;
  isDragging?: boolean;
  canEdit?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusCategory,
  isDragging = false,
  canEdit = true,
}) => {
  const formattedDue = formatDueDate(task.dueDate, statusCategory);

  return (
    <article
      data-testid={`task-card-${task.id}`}
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      className={`group relative rounded-card border bg-white p-3.5 shadow-card transition-all ${
        isDragging
          ? 'rotate-1 border-brand-500 shadow-xl opacity-90'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-subtle'
      } ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
    >
      <h4 className="text-sm font-medium text-slate-900 leading-snug break-words">
        {task.title}
      </h4>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />

          {formattedDue && (
            <span
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium ${
                formattedDue.isOverdue
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {formattedDue.isOverdue ? (
                <AlertCircle className="h-3 w-3 text-red-500" />
              ) : (
                <Calendar className="h-3 w-3 text-slate-400" />
              )}
              {formattedDue.label}
            </span>
          )}
        </div>

        {/* Assignee Avatars */}
        <UserAvatarGroup assigneeIds={task.assigneeIds} />
      </div>
    </article>
  );
};
