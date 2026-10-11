import { Task, BaseContainer, User, Grant } from './types';
import { Result, ok, fail } from './result';
import { canViewNode, PermissionState } from './permissions';
import { getArchiveStatus } from './validation';

export interface StateForTaskByIdSelector {
  workspaces?: Record<string, BaseContainer>;
  spaces?: Record<string, BaseContainer>;
  folders?: Record<string, BaseContainer>;
  lists?: Record<string, BaseContainer>;
  tasks?: Record<string, Task>;
  grants?: Record<string, Grant> | Grant[];
  users?: Record<string, User>;
  currentUserId?: string;
}

function getAllNodes(
  state: StateForTaskByIdSelector
): Record<string, BaseContainer> {
  return {
    ...state.workspaces,
    ...state.spaces,
    ...state.folders,
    ...state.lists,
  };
}

function areNodesRefEqual(
  a: Record<string, BaseContainer>,
  b: Record<string, BaseContainer>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

const taskCache = new Map<
  string,
  {
    nodesRef: Record<string, BaseContainer>;
    tasksRef: Record<string, Task>;
    grantsRef: unknown;
    usersRef: unknown;
    userId: string | undefined;
    result: Result<Task>;
  }
>();

export function selectTaskById(
  state: StateForTaskByIdSelector,
  id: string
): Result<Task> {
  const allNodes = getAllNodes(state);
  const tasks = state.tasks ?? {};
  const grants = state.grants;
  const users = state.users ?? {};
  const currentUserId = state.currentUserId;

  const cached = taskCache.get(id);
  if (
    cached &&
    areNodesRefEqual(cached.nodesRef, allNodes) &&
    cached.tasksRef === tasks &&
    cached.grantsRef === grants &&
    cached.usersRef === users &&
    cached.userId === currentUserId
  ) {
    return cached.result;
  }

  const currentUser = currentUserId ? users[currentUserId] : undefined;
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(grants) ? grants : Object.values(grants ?? {}),
  };

  let result: Result<Task>;

  // 1. Raw task existence check
  const task = tasks[id];
  if (!task) {
    result = fail('NOT_FOUND', `Task '${id}' not found`);
  } else if (!canViewNode(currentUser, task.primaryListId, permState)) {
    // 2. Permission check on list: a deleted task in a denied list reads FORBIDDEN!
    result = fail('FORBIDDEN', `Access denied to task '${id}'`);
  } else if (allNodes[task.primaryListId]?.type !== 'list') {
    // 3. Target parent is not a list
    result = fail(
      'VALIDATION',
      `Container '${task.primaryListId}' is not a list`
    );
  } else if (task.archivedAt !== null) {
    // 4. Deleted task reads as NOT_FOUND
    result = fail('NOT_FOUND', `Task '${id}' not found`);
  } else if (getArchiveStatus(task.primaryListId, allNodes) !== 'active') {
    // 5. Hierarchy archived or corrupt
    result = fail(
      'CONFLICT',
      'Task belongs to an archived or unavailable list'
    );
  } else {
    // 6. Success
    result = ok(task);
  }

  taskCache.set(id, {
    nodesRef: allNodes,
    tasksRef: tasks,
    grantsRef: grants,
    usersRef: users,
    userId: currentUserId,
    result,
  });

  return result;
}
