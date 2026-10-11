import { Status, Task } from './types';

export const PRIORITY_RANK: Record<Task['priority'], number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
  none: 0,
};

export type SortKey = 'dueDate' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

/**
 * Pure function to cycle through sort configurations:
 * null -> asc -> desc -> null
 * Switching to a new key resets direction to 'asc'.
 */
export function nextSort(
  current: SortConfig | null,
  key: SortKey
): SortConfig | null {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }

  return null;
}

/**
 * Default comparator breaking ties by:
 * 1. status.position ascending
 * 2. task.position ascending
 * 3. task.id ascending (deterministic tie-breaker)
 */
function compareDefault(
  a: Task,
  b: Task,
  statuses: Record<string, Status>
): number {
  const statusA = statuses[a.statusId];
  const statusB = statuses[b.statusId];

  const posA = statusA?.position ?? Number.MAX_SAFE_INTEGER;
  const posB = statusB?.position ?? Number.MAX_SAFE_INTEGER;

  if (posA !== posB) {
    return posA - posB;
  }

  if (a.position !== b.position) {
    return a.position - b.position;
  }

  return a.id.localeCompare(b.id);
}

/**
 * Sorts tasks for the List view table without mutating the input array.
 *
 * Rules:
 * - Priority: 'asc' = urgent first (rank 4 -> 0); 'desc' = none first (rank 0 -> 4)
 * - Due Date: 'asc' = soonest first; 'desc' = latest first; nulls sort last in both directions
 * - Ties: Always broken by the default status/task order
 */
export function sortTasksForListView(
  tasks: Task[],
  config: SortConfig | null,
  statuses: Record<string, Status>
): Task[] {
  // Pure function: never mutate input array (D-053)
  const result = [...tasks];

  if (!config) {
    return result.sort((a, b) => compareDefault(a, b, statuses));
  }

  return result.sort((a, b) => {
    if (config.key === 'priority') {
      const rankA = PRIORITY_RANK[a.priority] ?? 0;
      const rankB = PRIORITY_RANK[b.priority] ?? 0;

      if (rankA !== rankB) {
        // asc = urgent first (higher rank first)
        return config.direction === 'asc' ? rankB - rankA : rankA - rankB;
      }
      return compareDefault(a, b, statuses);
    }

    if (config.key === 'dueDate') {
      // Null due dates are always placed at the end in both directions
      if (a.dueDate === null && b.dueDate === null) {
        return compareDefault(a, b, statuses);
      }
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;

      // Both have valid dates: compare canonical ISO UTC strings directly
      const diff =
        config.direction === 'asc'
          ? a.dueDate.localeCompare(b.dueDate)
          : b.dueDate.localeCompare(a.dueDate);

      if (diff !== 0) {
        return diff;
      }
      return compareDefault(a, b, statuses);
    }

    return compareDefault(a, b, statuses);
  });
}
