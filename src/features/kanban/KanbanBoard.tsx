import React from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import {
  selectKanbanColumns,
  selectCanEditCurrentList,
} from '@/domain/selectors';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useKanbanDnd } from './useKanbanDnd';

export interface KanbanBoardProps {
  onOpenTask?: (taskId: string) => void;
  onOpenCreateTask?: (statusId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onOpenTask,
  onOpenCreateTask,
}) => {
  const state = useFlowboardStore();
  const selectedListId = useFlowboardStore((s) => s.selectedListId);
  const canEdit = selectCanEditCurrentList(state);
  const columnsRes = selectKanbanColumns(state);

  const columns = columnsRes.success ? columnsRes.data : [];

  const {
    activeTask,
    sensors,
    announcements,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDnd(columns, canEdit);

  if (!selectedListId || !columnsRes.success) {
    return null;
  }

  // Find status category of active task for drag overlay
  const activeStatusCategory =
    activeTask &&
    columns.find((c) => c.status.id === activeTask.statusId)?.status.category;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{ announcements }}
    >
      <div
        data-testid="kanban-board"
        className="flex h-full flex-1 gap-4 overflow-x-auto pb-2 pt-1 min-h-0 min-w-0"
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.status.id}
            column={column}
            listId={selectedListId}
            canEdit={canEdit}
            onOpenTask={onOpenTask}
            onOpenCreateTask={onOpenCreateTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && activeStatusCategory ? (
          <TaskCard
            task={activeTask}
            statusCategory={activeStatusCategory}
            isDragging={true}
            canEdit={canEdit}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
