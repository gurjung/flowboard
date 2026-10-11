import { FlowboardStoreState, StoreDeps, SetStoreState } from '../types';
import { Task } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { canEditTasksInList, canViewNode } from '@/domain/permissions';
import { getArchiveStatus } from '@/domain/validation';
import {
  getActiveTasksInColumn,
  reindexTaskPositions,
  mapStatusAcrossLists,
} from '@/domain/taskOrdering';
import { getTaskPermState, getListStatuses } from './taskHelpers';

export function executeMoveTaskToList(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  id: string,
  targetListId: string
): Result<Task> {
  const { allNodes, currentUser, permState } = getTaskPermState(state);

  if (!currentUser) return fail('FORBIDDEN', 'User session is invalid');

  // 1. Task exists
  const task = state.tasks[id];
  if (!task) return fail('NOT_FOUND', `Task '${id}' not found`);

  // 2. Edit on source
  if (!canEditTasksInList(currentUser, task.primaryListId, permState)) {
    return fail(
      'FORBIDDEN',
      `Cannot edit tasks in source list '${task.primaryListId}'`
    );
  }

  // 3. Deleted check
  if (task.archivedAt !== null) {
    return fail('NOT_FOUND', `Task '${id}' not found`);
  }

  // 4. Destination exists
  const destNode = allNodes[targetListId];
  if (!destNode)
    return fail('NOT_FOUND', `Destination list '${targetListId}' not found`);

  // 5. View permission on destination (denied container stays FORBIDDEN)
  if (!canViewNode(currentUser, targetListId, permState)) {
    return fail(
      'FORBIDDEN',
      `Cannot view destination container '${targetListId}'`
    );
  }

  // 6. Destination must be a list
  if (destNode.type !== 'list') {
    return fail(
      'INVALID_PARENT',
      `Destination '${targetListId}' is not a list`
    );
  }

  // 7. Edit on destination
  if (!canEditTasksInList(currentUser, targetListId, permState)) {
    return fail(
      'FORBIDDEN',
      `Cannot edit tasks in destination list '${targetListId}'`
    );
  }

  // 7. D-040: Assignee check
  const unauthorizedAssignees: string[] = [];
  for (const assigneeId of task.assigneeIds) {
    const user = state.users[assigneeId];
    if (user && !canViewNode(user, targetListId, permState)) {
      unauthorizedAssignees.push(user.name);
    }
  }
  if (unauthorizedAssignees.length > 0) {
    return fail(
      'VALIDATION',
      `Cannot move task: assignees [${unauthorizedAssignees.join(', ')}] do not have view access to destination list`
    );
  }

  // 8. Source or destination archived/conflict
  if (
    getArchiveStatus(task.primaryListId, allNodes) !== 'active' ||
    getArchiveStatus(targetListId, allNodes) !== 'active'
  ) {
    return fail(
      'CONFLICT',
      'Source or destination list is archived or unavailable'
    );
  }

  // 9. Same-list no-op success (after all guards pass)
  if (targetListId === task.primaryListId) {
    return ok(task);
  }

  // 10. Map status by category to destination's first status of that category, fallback first status
  const sourceStatus = state.statuses[task.statusId];
  const destStatuses = getListStatuses(state.statuses, targetListId);
  const mappedStatus = sourceStatus
    ? mapStatusAcrossLists(sourceStatus, destStatuses)
    : (destStatuses[0] ?? null);

  if (!mappedStatus) {
    return fail(
      'INVALID_STATUS',
      `Destination list '${targetListId}' has no available statuses`
    );
  }

  // Reindex source column
  const sourceColumn = getActiveTasksInColumn(
    state.tasks,
    task.primaryListId,
    task.statusId
  ).filter((t) => t.id !== id);
  const { updatedTasks: sourceUpdates } = reindexTaskPositions(sourceColumn);

  // Append to destination column
  const destColumn = getActiveTasksInColumn(
    state.tasks,
    targetListId,
    mappedStatus.id
  );
  const position = destColumn.length;
  const now = deps.now();

  const updatedDirectTask: Task = {
    ...task,
    primaryListId: targetListId,
    statusId: mappedStatus.id,
    position,
    updatedAt: now,
  };

  set((s) => ({
    tasks: {
      ...s.tasks,
      ...sourceUpdates,
      [id]: updatedDirectTask,
    },
  }));

  return ok(updatedDirectTask);
}
