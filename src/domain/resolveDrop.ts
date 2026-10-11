import { Status, Task } from './types';

export interface KanbanColumnData {
  status: Status;
  tasks: Task[];
}

export interface DropResolution {
  statusId: string;
  index: number;
}

/**
 * Pure domain function to resolve the target status and final 0-indexed position
 * when a task is dropped on a Kanban board.
 *
 * @param columns Array of columns with status and active tasks in contiguous order
 * @param activeId The ID of the task being dragged
 * @param overId The ID of the droppable target (task ID, status ID, or column container ID)
 * @param isBelowOver True if pointer / center is in the bottom half of the over card
 * @returns { statusId, index } representing the FINAL position, or null if no-op / invalid
 */
export function resolveDrop(
  columns: KanbanColumnData[],
  activeId: string,
  overId: string | null,
  isBelowOver = false
): DropResolution | null {
  if (!activeId || !overId) {
    return null;
  }

  // 1. Locate source column and source index
  let sourceCol: KanbanColumnData | undefined;
  let sourceIndex = -1;

  for (const col of columns) {
    const idx = col.tasks.findIndex((t) => t.id === activeId);
    if (idx !== -1) {
      sourceCol = col;
      sourceIndex = idx;
      break;
    }
  }

  if (!sourceCol || sourceIndex === -1) {
    return null;
  }

  // 2. Check if overId targets a column container directly
  const targetColByContainer = columns.find(
    (col) => col.status.id === overId || `column-${col.status.id}` === overId
  );

  if (targetColByContainer) {
    // Dropping onto container
    if (targetColByContainer.status.id === sourceCol.status.id) {
      // Dropping onto own column container
      const targetIndex = isBelowOver ? sourceCol.tasks.length - 1 : 0;
      if (targetIndex === sourceIndex) {
        return null; // Dropped on self / current index
      }
      return { statusId: sourceCol.status.id, index: targetIndex };
    }

    // Cross-column container drop
    if (targetColByContainer.tasks.length === 0) {
      return { statusId: targetColByContainer.status.id, index: 0 };
    }

    const targetIndex = isBelowOver ? targetColByContainer.tasks.length : 0;
    return { statusId: targetColByContainer.status.id, index: targetIndex };
  }

  // 3. Locate destination card and column
  let destCol: KanbanColumnData | undefined;
  let destIndex = -1;

  for (const col of columns) {
    const idx = col.tasks.findIndex((t) => t.id === overId);
    if (idx !== -1) {
      destCol = col;
      destIndex = idx;
      break;
    }
  }

  if (!destCol || destIndex === -1) {
    return null; // Target not found in any column (pointer in gap)
  }

  // 4. Same column reorder
  if (sourceCol.status.id === destCol.status.id) {
    if (activeId === overId) {
      return null; // Dropped on itself
    }

    if (sourceIndex < destIndex) {
      // Moving down: dropping above destIndex puts it at destIndex - 1; below puts it at destIndex
      const finalIndex = isBelowOver ? destIndex : destIndex - 1;
      if (finalIndex === sourceIndex) {
        return null;
      }
      return { statusId: sourceCol.status.id, index: finalIndex };
    } else {
      // Moving up: dropping above destIndex puts it at destIndex; below puts it at destIndex + 1
      const finalIndex = isBelowOver ? destIndex + 1 : destIndex;
      if (finalIndex === sourceIndex) {
        return null;
      }
      return { statusId: sourceCol.status.id, index: finalIndex };
    }
  }

  // 5. Cross-column transfer
  const finalIndex = isBelowOver ? destIndex + 1 : destIndex;
  return { statusId: destCol.status.id, index: finalIndex };
}
