import { Result, fail, ok } from './result';
import { canEditTasksInList, toPermissionState } from './permissions';
import { selectStatusesForList } from './statusSelectors';
import { selectTasksForList } from './taskSelectors';
import { KanbanColumnData } from './resolveDrop';
import { FlowboardStoreState } from '@/store/types';
import { Status, Task } from './types';

// Per-column cache to preserve reference stability for untouched columns
interface CachedColumn {
  status: Status;
  tasks: Task[];
  columnData: KanbanColumnData;
}
const columnCache = new Map<string, CachedColumn>();

function areTaskArraysEqual(a: Task[], b: Task[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Returns grouped status columns and their active tasks for a list.
 * Every status gets a column (even if tasks are empty).
 * Memoized per column: untouched columns maintain identical task array references.
 */
export function selectKanbanColumns(
  state: FlowboardStoreState,
  listId?: string | null
): Result<KanbanColumnData[]> {
  const targetListId = listId !== undefined ? listId : state.selectedListId;
  if (!targetListId) {
    return fail('NOT_FOUND', 'No list selected');
  }

  const statusesRes = selectStatusesForList(state, targetListId);
  if (!statusesRes.success) {
    return statusesRes;
  }

  const tasksRes = selectTasksForList(state, targetListId);
  if (!tasksRes.success) {
    return tasksRes;
  }

  const statuses = statusesRes.data;
  const tasks = tasksRes.data;

  const columns: KanbanColumnData[] = statuses.map((status) => {
    const colTasks = tasks.filter((t) => t.statusId === status.id);
    const cached = columnCache.get(status.id);

    if (
      cached &&
      cached.status === status &&
      areTaskArraysEqual(cached.tasks, colTasks)
    ) {
      return cached.columnData;
    }

    const newColumnData: KanbanColumnData = {
      status,
      tasks: colTasks,
    };

    columnCache.set(status.id, {
      status,
      tasks: colTasks,
      columnData: newColumnData,
    });

    return newColumnData;
  });

  return ok(columns);
}

/**
 * Evaluates whether the active session user has permission to edit tasks
 * in the currently selected list.
 */
export function selectCanEditCurrentList(state: FlowboardStoreState): boolean {
  if (!state.selectedListId || !state.currentUserId) {
    return false;
  }

  const user = state.users[state.currentUserId];
  if (!user) {
    return false;
  }

  const permState = toPermissionState(state);
  return canEditTasksInList(user, state.selectedListId, permState);
}
