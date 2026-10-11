import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumnData } from '@/domain/resolveDrop';
import { STATUS_COLOR_MAP } from '@/domain/statusColors';
import { StatusColorToken } from '@/domain/types';
import { SortableTaskCard } from './SortableTaskCard';
import { QuickTaskInput } from './QuickTaskInput';
import { Plus } from 'lucide-react';

export interface KanbanColumnProps {
  column: KanbanColumnData;
  listId: string;
  canEdit?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  listId,
  canEdit = true,
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

  const colorStyles =
    STATUS_COLOR_MAP[status.color as StatusColorToken] ||
    STATUS_COLOR_MAP.slate;

  return (
    <section
      ref={setNodeRef}
      data-testid={`kanban-column-${status.id}`}
      aria-label={`${status.name} column`}
      className={`flex w-72 shrink-0 flex-col h-full max-h-full rounded-panel border bg-slate-50/70 p-3 transition-colors ${
        isOver
          ? 'border-brand-400 bg-brand-50/30'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Column Header */}
      <header className="mb-3 shrink-0 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colorStyles.dot}`} />
          <h3 className="text-xs font-semibold tracking-wide text-slate-800 uppercase">
            {status.name}
          </h3>
        </div>
        <span
          data-testid={`column-count-${status.id}`}
          className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-600"
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
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isCreating && (
          <div
            data-testid={`empty-column-${status.id}`}
            className="flex flex-1 flex-col items-center justify-center rounded-card border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400"
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

      {/* Bottom Action */}
      {canEdit && !isCreating && (
        <div className="shrink-0 pt-2">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            data-testid={`add-task-btn-${status.id}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-card border border-transparent py-1.5 text-xs font-medium text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            Add task
          </button>
        </div>
      )}
    </section>
  );
};
