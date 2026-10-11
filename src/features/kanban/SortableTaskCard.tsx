import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, StatusCategory } from '@/domain/types';
import { TaskCard } from './TaskCard';

export interface SortableTaskCardProps {
  task: Task;
  statusCategory: StatusCategory;
  canEdit?: boolean;
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  statusCategory,
  canEdit = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });

  /**
   * ARCHITECTURAL EXCEPTION (D-048 / F8 Gate 6):
   * This is the ONLY `style=` attribute permitted across the entire codebase.
   * Required strictly for @dnd-kit hardware-accelerated pointer translation.
   * All other visual styling uses Tailwind utility classes exclusively.
   */
  const dndTransformStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={dndTransformStyle}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      className={isDragging ? 'opacity-40' : undefined}
    >
      <TaskCard
        task={task}
        statusCategory={statusCategory}
        isDragging={isDragging}
        canEdit={canEdit}
      />
    </div>
  );
};
