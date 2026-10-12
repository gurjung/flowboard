import { Task } from './types';

/**
 * Filters tasks by case-insensitive matching against title and description.
 * If query is empty or whitespace-only, returns the original tasks array unchanged.
 */
export function filterTasksByQuery(
  tasks: readonly Task[],
  query?: string | null
): Task[] {
  if (!query || !query.trim()) {
    return tasks as Task[];
  }

  const normalized = query.trim().toLowerCase();

  return tasks.filter((task) => {
    const titleMatches = task.title.toLowerCase().includes(normalized);
    const descMatches = task.description
      ? task.description.toLowerCase().includes(normalized)
      : false;
    return titleMatches || descMatches;
  });
}
