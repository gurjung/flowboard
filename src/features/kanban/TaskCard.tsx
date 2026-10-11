import React from 'react';
import { Task, StatusCategory } from '@/domain/types';
import { formatDueDate } from '@/domain/dueDate';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { Calendar, AlertCircle } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  statusCategory: StatusCategory;
  isDragging?: boolean;
  canEdit?: boolean;
}

const PRIORITY_STYLES: Record<
  Task['priority'],
  { label: string; badgeClass: string; dotClass: string }
> = {
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  none: {
    label: 'None',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusCategory,
  isDragging = false,
  canEdit = true,
}) => {
  const users = useFlowboardStore((s) => s.users);
  const formattedDue = formatDueDate(task.dueDate, statusCategory);
  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.none;

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
          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium ${priorityInfo.badgeClass}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${priorityInfo.dotClass}`}
            />
            {priorityInfo.label}
          </span>

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
        {task.assigneeIds.length > 0 && (
          <div className="flex -space-x-1 overflow-hidden">
            {task.assigneeIds.map((userId) => {
              const user = users[userId];
              if (!user) return null; // Unknown IDs render nothing per requirement
              const initials = user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={userId}
                  title={user.name}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 ring-1 ring-white"
                >
                  {initials}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};
