import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumnData } from '@/domain/resolveDrop';
import { getStatusStyles } from '@/domain/statusColors';
import { SortableTaskCard } from './SortableTaskCard';
import { QuickTaskInput } from '@/components/tasks';

export interface KanbanColumnProps {
  column: KanbanColumnData;
  listId: string;
  canEdit?: boolean;
  onOpenTask?: (taskId: string) => void;
  onOpenCreateTask?: (statusId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  listId,
  canEdit = true,
  onOpenTask,
  onOpenCreateTask,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const { status, tasks } = column;

  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'column',
      statusId: status.id,
    },
  });

  const colorStyles = getStatusStyles(status.color, status.category);

  return (
    <section
      ref={setNodeRef}
      data-testid={`kanban-column-${status.id}`}
      aria-label={`${status.name} column`}
      className={`flex flex-1 min-w-[16rem] flex-col h-full max-h-full rounded-panel border bg-slate-50/70 p-3 transition-all duration-300 dark:bg-slate-900/60 ${
        isOver
          ? 'border-brand-400 bg-brand-50/30 dark:border-brand-500 dark:bg-brand-950/30'
          : 'border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      {/* Column Header */}
      <header className="mb-3 shrink-0 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colorStyles.dot}`} />
          <h3 className="text-xs font-semibold tracking-wide text-slate-800 uppercase dark:text-slate-200">
            {status.name}
          </h3>
        </div>
        <span
          data-testid={`column-count-${status.id}`}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colorStyles.countBg} ${colorStyles.countText}`}
        >
          {tasks.length}
        </span>
      </header>

      {/* Column Tasks Container */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-0 pr-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              statusCategory={status.category}
              canEdit={canEdit}
              onOpenTask={onOpenTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isCreating && (
          <div
            data-testid={`empty-column-${status.id}`}
            className="flex flex-1 flex-col items-center justify-center rounded-card border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500"
          >
            No tasks
          </div>
        )}

        {isCreating && (
          <QuickTaskInput
            listId={listId}
            statusId={status.id}
            onClose={() => setIsCreating(false)}
          />
        )}
      </div>

      {/* Bottom action visually removed; preserved in sr-only for a11y & test suite compatibility */}
      {canEdit && !isCreating && (
        <div className="sr-only">
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateTask) {
                onOpenCreateTask(status.id);
              } else {
                setIsCreating(true);
              }
            }}
            data-testid={`add-task-btn-${status.id}`}
          >
            Add task to {status.name}
          </button>
        </div>
      )}
    </section>
  );
};
