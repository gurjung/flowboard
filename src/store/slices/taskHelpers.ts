import { FlowboardStoreState } from '../types';
import { Task, Status, BaseContainer, User } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { canEditTasksInList, PermissionState } from '@/domain/permissions';
import { getAllNodes } from './containerSlice';
import {
  getActiveTasksInColumn,
  reindexTaskPositions,
} from '@/domain/taskOrdering';

export function getTaskPermState(state: FlowboardStoreState): {
  allNodes: Record<string, BaseContainer>;
  currentUser: User | undefined;
  permState: PermissionState;
} {
  const allNodes = getAllNodes(state);
  const currentUser = state.users[state.currentUserId];
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(state.grants)
      ? state.grants
      : Object.values(state.grants),
  };
  return { allNodes, currentUser, permState };
}

export function checkTaskMutationCommonGuards(
  state: FlowboardStoreState,
  taskId: string
): Result<{
  task: Task;
  currentUser: User;
  allNodes: Record<string, BaseContainer>;
  permState: PermissionState;
}> {
  const { allNodes, currentUser, permState } = getTaskPermState(state);

  // 1. Session check
  if (!currentUser) {
    return fail('FORBIDDEN', 'User session is invalid');
  }

  // 2. Raw task exists
  const task = state.tasks[taskId];
  if (!task) {
    return fail('NOT_FOUND', `Task '${taskId}' not found`);
  }

  // 3. Edit permission on task's primary list (fails closed if corrupt chain)
  if (!canEditTasksInList(currentUser, task.primaryListId, permState)) {
    return fail(
      'FORBIDDEN',
      `Cannot edit tasks in list '${task.primaryListId}'`
    );
  }

  // 4. Task deleted check: reads as NOT_FOUND
  if (task.archivedAt !== null) {
    return fail('NOT_FOUND', `Task '${taskId}' not found`);
  }

  return ok({ task, currentUser, allNodes, permState });
}

export function getListStatuses(
  statuses: Record<string, Status>,
  listId: string
): Status[] {
  return Object.values(statuses)
    .filter((s) => s.listId === listId)
    .sort((a, b) => a.position - b.position);
}

export function getDefaultStatusForList(
  statuses: Record<string, Status>,
  listId: string
): Status | null {
  const listStatuses = getListStatuses(statuses, listId);
  if (listStatuses.length === 0) return null;
  const todoStatus = listStatuses.find((s) => s.category === 'todo');
  return todoStatus ?? listStatuses[0] ?? null;
}

export function performColumnTransfer(
  tasks: Record<string, Task>,
  task: Task,
  targetStatusId: string,
  targetIndex: number,
  now: string
): { updatedTasks: Record<string, Task>; updatedDirectTask: Task } {
  const sourceColumn = getActiveTasksInColumn(
    tasks,
    task.primaryListId,
    task.statusId
  ).filter((t) => t.id !== task.id);
  const { updatedTasks: sourceUpdates } = reindexTaskPositions(sourceColumn);

  const destColumn = getActiveTasksInColumn(
    tasks,
    task.primaryListId,
    targetStatusId
  );
  const newDestList = [...destColumn];
  newDestList.splice(targetIndex, 0, task);
  const { updatedTasks: destUpdates } = reindexTaskPositions(newDestList);

  const updatedDirectTask: Task = {
    ...task,
    statusId: targetStatusId,
    position: targetIndex,
    updatedAt: now,
  };

  return {
    updatedTasks: {
      ...sourceUpdates,
      ...destUpdates,
      [task.id]: updatedDirectTask,
    },
    updatedDirectTask,
  };
}
