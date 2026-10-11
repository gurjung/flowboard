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
  onOpenTask?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusCategory,
  isDragging = false,
  canEdit = true,
  onOpenTask,
}) => {
  const formattedDue = formatDueDate(task.dueDate, statusCategory);
  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // drag move completed, don't open drawer
      }
    }
    onOpenTask?.(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenTask?.(task.id);
    }
  };

  return (
    <article
      data-testid={`task-card-${task.id}`}
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
