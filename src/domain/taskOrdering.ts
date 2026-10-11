import { Task, Status } from './types';
import { Result, ok, fail } from './result';

export function getActiveTasksInColumn(
  tasks: Record<string, Task> | Task[],
  listId: string,
  statusId: string
): Task[] {
  const taskArray = Array.isArray(tasks) ? tasks : Object.values(tasks);
  return taskArray
    .filter(
      (t) =>
        t.primaryListId === listId &&
        t.statusId === statusId &&
        t.archivedAt === null
    )
    .sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a.id.localeCompare(b.id);
    });
}

export function reindexTaskPositions(columnTasks: Task[]): {
  updatedTasks: Record<string, Task>;
  changedCount: number;
} {
  const updatedTasks: Record<string, Task> = {};
  let changedCount = 0;

  for (let i = 0; i < columnTasks.length; i++) {
    const task = columnTasks[i]!;
    if (task.position !== i) {
      // Direct requirement: only position changes; updatedAt remains untouched on siblings
      updatedTasks[task.id] = {
        ...task,
        position: i,
      };
      changedCount++;
    }
  }

  return { updatedTasks, changedCount };
}

export function reorderTaskInColumn(
  activeColumnTasks: Task[],
  targetTaskId: string,
  newIndex: number
): Result<Task[]> {
  const currentIndex = activeColumnTasks.findIndex(
    (t) => t.id === targetTaskId
  );
  if (currentIndex === -1) {
    return fail(
      'NOT_FOUND',
      `Task '${targetTaskId}' not found in active column`
    );
  }

  if (!Number.isInteger(newIndex)) {
    return fail('VALIDATION', `Target index ${newIndex} must be an integer`);
  }

  if (newIndex < 0 || newIndex >= activeColumnTasks.length) {
    return fail(
      'VALIDATION',
      `Target index ${newIndex} is out of bounds [0..${activeColumnTasks.length - 1}]`
    );
  }

  if (currentIndex === newIndex) {
    return ok(activeColumnTasks);
  }

  const result = [...activeColumnTasks];
  const [removed] = result.splice(currentIndex, 1);
  if (removed) {
    result.splice(newIndex, 0, removed);
  }

  return ok(result);
}

export function mapStatusAcrossLists(
  sourceStatus: Status,
  targetListStatuses: Status[]
): Status | null {
  if (targetListStatuses.length === 0) {
    return null;
  }
  const sorted = [...targetListStatuses].sort(
    (a, b) => a.position - b.position
  );
  const matched = sorted.find((s) => s.category === sourceStatus.category);
  return matched ?? sorted[0] ?? null;
}

export function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
