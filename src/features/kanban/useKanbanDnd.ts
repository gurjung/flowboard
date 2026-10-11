import { useState, useEffect, useCallback } from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  Announcements,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { useToast } from '@/components/toasts';
import { resolveDrop, KanbanColumnData } from '@/domain/resolveDrop';
import { Task } from '@/domain/types';

export function useKanbanDnd(columns: KanbanColumnData[], canEdit: boolean) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const toast = useToast();

  const changeTaskStatus = useFlowboardStore((s) => s.changeTaskStatus);
  const reorderTask = useFlowboardStore((s) => s.reorderTask);
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const selectedListId = useFlowboardStore((s) => s.selectedListId);

  // Cancellation on stale session, list selection, or archive (D-029/D-032)
  useEffect(() => {
    setActiveTask(null);
  }, [currentUserId, selectedListId]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(
    ...(canEdit ? [pointerSensor, keyboardSensor] : [])
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!canEdit) return;
      const taskId = String(event.active.id);
      for (const col of columns) {
        const found = col.tasks.find((t) => t.id === taskId);
        if (found) {
          setActiveTask(found);
          break;
        }
      }
    },
    [canEdit, columns]
  );

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveTask(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const current = activeTask;
      setActiveTask(null);

      if (!canEdit || !current || !over) {
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);

      // Check if dragged downwards relative to over item
      const isBelowOver = event.delta.y > 0;

      const resolution = resolveDrop(columns, activeId, overId, isBelowOver);
      if (!resolution) {
        return; // No-op: drop on self or invalid target
      }

      if (resolution.statusId === current.statusId) {
        const res = await reorderTask(current.id, resolution.index);
        if (!res.success) {
          toast.error(res.error.message);
        }
      } else {
        const res = await changeTaskStatus(
          current.id,
          resolution.statusId,
          resolution.index
        );
        if (!res.success) {
          toast.error(res.error.message);
        }
      }
    },
    [canEdit, activeTask, columns, reorderTask, changeTaskStatus, toast]
  );

  // Screen-reader live region announcements (visible tasks only)
  const announcements: Announcements = {
    onDragStart({ active }) {
      const task = columns
        .flatMap((c) => c.tasks)
        .find((t) => t.id === active.id);
      return task ? `Picked up task: ${task.title}` : undefined;
    },
    onDragOver({ over }) {
      if (!over) return undefined;
      const overTask = columns
        .flatMap((c) => c.tasks)
        .find((t) => t.id === over.id);
      return overTask ? `Moved over task: ${overTask.title}` : undefined;
    },
    onDragEnd({ over }) {
      return over ? `Dropped task.` : 'Dragging cancelled.';
    },
    onDragCancel() {
      return 'Dragging cancelled.';
    },
  };

  return {
    activeTask,
    sensors,
    announcements,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
