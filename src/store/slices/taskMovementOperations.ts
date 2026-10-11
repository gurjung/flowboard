import { FlowboardStoreState, StoreDeps, SetStoreState } from '../types';
import { Task } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import {
  getActiveTasksInColumn,
  reindexTaskPositions,
  reorderTaskInColumn,
} from '@/domain/taskOrdering';
import {
  checkTaskMutationCommonGuards,
  performColumnTransfer,
} from './taskHelpers';

export { executeMoveTaskToList } from './moveTaskOperation';

export function executeChangeTaskStatus(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  id: string,
  statusId: string,
  index?: number
): Result<Task> {
  const guardRes = checkTaskMutationCommonGuards(state, id);
  if (!guardRes.success) return guardRes;

  const { task, allNodes } = guardRes.data;

  // Status must belong to task's list
  const targetStatus = state.statuses[statusId];
  if (!targetStatus || targetStatus.listId !== task.primaryListId) {
    return fail(
      'INVALID_STATUS',
      `Status '${statusId}' does not belong to list '${task.primaryListId}'`
    );
  }

  const destTasks = getActiveTasksInColumn(
    state.tasks,
    task.primaryListId,
    statusId
  );

  const isSameStatus = statusId === task.statusId;
  const maxAllowedIndex = isSameStatus
    ? destTasks.length - 1
    : destTasks.length;

  if (index !== undefined) {
    if (!Number.isInteger(index)) {
      return fail('VALIDATION', `Index ${index} must be an integer`);
    }
    if (
      index < 0 ||
      index > maxAllowedIndex ||
      (isSameStatus && destTasks.length === 0)
    ) {
      return fail(
        'VALIDATION',
        `Index ${index} out of bounds [0..${maxAllowedIndex}]`
      );
    }
  }

  // Conflict (archived hierarchy) after all validations
  if (getArchiveStatus(task.primaryListId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Task belongs to an archived or unavailable list');
  }

  // Same status transition
  if (isSameStatus) {
    if (index === undefined || index === task.position) {
      return ok(task);
    }

    const reorderedRes = reorderTaskInColumn(destTasks, id, index);
    if (!reorderedRes.success) return reorderedRes;

    const { updatedTasks } = reindexTaskPositions(reorderedRes.data);
    const now = deps.now();
    const updatedDirectTask: Task = {
      ...task,
      position: index,
      updatedAt: now,
    };

    set((s) => ({
      tasks: {
        ...s.tasks,
        ...updatedTasks,
        [id]: updatedDirectTask,
      },
    }));
    return ok(updatedDirectTask);
  }

  // Cross-status transition
  const targetIndex = index ?? destTasks.length;
  const { updatedTasks, updatedDirectTask } = performColumnTransfer(
    state.tasks,
    task,
    statusId,
    targetIndex,
    deps.now()
  );

  set((s) => ({ tasks: { ...s.tasks, ...updatedTasks } }));
  return ok(updatedDirectTask);
}

export function executeDeleteTask(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  id: string
): Result<void> {
  const guardRes = checkTaskMutationCommonGuards(state, id);
  if (!guardRes.success) return guardRes;

  const { task, allNodes } = guardRes.data;

  // Container archived
  if (getArchiveStatus(task.primaryListId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Task belongs to an archived or unavailable list');
  }

  const now = deps.now();
  const deletedTask: Task = {
    ...task,
    archivedAt: now,
    updatedAt: now,
  };

  // Reindex remaining active tasks in column
  const remainingActive = getActiveTasksInColumn(
    state.tasks,
    task.primaryListId,
    task.statusId
  ).filter((t) => t.id !== id);
  const { updatedTasks } = reindexTaskPositions(remainingActive);

  set((s) => ({
    tasks: {
      ...s.tasks,
      ...updatedTasks,
      [id]: deletedTask,
    },
  }));

  return ok(undefined);
}
