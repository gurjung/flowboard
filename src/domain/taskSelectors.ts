import { Task, BaseContainer, User, Grant } from './types';
import { Result, ok, fail } from './result';
import { canViewNode, PermissionState } from './permissions';
import { getArchiveStatus } from './validation';

export { selectTaskById } from './taskByIdSelector';

export interface StateForTaskSelectors {
  workspaces?: Record<string, BaseContainer>;
  spaces?: Record<string, BaseContainer>;
  folders?: Record<string, BaseContainer>;
  lists?: Record<string, BaseContainer>;
  tasks?: Record<string, Task>;
  grants?: Record<string, Grant> | Grant[];
  users?: Record<string, User>;
  currentUserId?: string;
  selectedListId?: string | null;
}

function getAllNodes(
  state: StateForTaskSelectors
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

const listCache = new Map<
  string,
  {
    nodesRef: Record<string, BaseContainer>;
    tasksRef: Record<string, Task>;
    grantsRef: unknown;
    usersRef: unknown;
    userId: string | undefined;
    result: Result<Task[]>;
  }
>();

let lastCurrentListTasksSelectedId: string | null | undefined = undefined;
let lastCurrentListTasksResult: Result<Task[]> | null = null;
let lastCurrentListTasksRef: unknown = null;
let lastCurrentListNodesRef: Record<string, BaseContainer> | null = null;
let lastCurrentListGrantsRef: unknown = null;
let lastCurrentListUsersRef: unknown = null;
let lastCurrentListUserId: string | undefined = undefined;

export function selectTasksForList(
  state: StateForTaskSelectors,
  listId: string
): Result<Task[]> {
  const allNodes = getAllNodes(state);
  const tasks = state.tasks ?? {};
  const grants = state.grants;
  const users = state.users ?? {};
  const currentUserId = state.currentUserId;

  const cached = listCache.get(listId);
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

  let result: Result<Task[]>;

  const node = allNodes[listId];
  if (!node) {
    result = fail('NOT_FOUND', `List '${listId}' not found`);
  } else if (!canViewNode(currentUser, listId, permState)) {
    result = fail('FORBIDDEN', `Access denied to list '${listId}'`);
  } else if (node.type !== 'list') {
    result = fail('VALIDATION', `Container '${listId}' is not a list`);
  } else if (getArchiveStatus(listId, allNodes) !== 'active') {
    result = fail('CONFLICT', `List '${listId}' is archived or unavailable`);
  } else {
    const activeTasks = Object.values(tasks)
      .filter((t) => t.primaryListId === listId && t.archivedAt === null)
      .sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        return a.id.localeCompare(b.id);
      });
    result = ok(activeTasks);
  }

  listCache.set(listId, {
    nodesRef: allNodes,
    tasksRef: tasks,
    grantsRef: grants,
    usersRef: users,
    userId: currentUserId,
    result,
  });

  return result;
}

const NO_LIST_SELECTED_RESULT = fail<Task[]>('NOT_FOUND', 'No list selected');

export function selectTasksForCurrentList(
  state: StateForTaskSelectors
): Result<Task[]> {
  const selectedListId = state.selectedListId;
  if (!selectedListId) {
    return NO_LIST_SELECTED_RESULT;
  }

  const allNodes = getAllNodes(state);
  const tasks = state.tasks ?? {};
  const grants = state.grants;
  const users = state.users ?? {};
  const currentUserId = state.currentUserId;

  if (
    lastCurrentListTasksResult !== null &&
    lastCurrentListTasksSelectedId === selectedListId &&
    lastCurrentListTasksRef === tasks &&
    lastCurrentListNodesRef !== null &&
    areNodesRefEqual(lastCurrentListNodesRef, allNodes) &&
    lastCurrentListGrantsRef === grants &&
    lastCurrentListUsersRef === users &&
    lastCurrentListUserId === currentUserId
  ) {
    return lastCurrentListTasksResult;
  }

  const result = selectTasksForList(state, selectedListId);

  lastCurrentListTasksSelectedId = selectedListId;
  lastCurrentListTasksResult = result;
  lastCurrentListTasksRef = tasks;
  lastCurrentListNodesRef = allNodes;
  lastCurrentListGrantsRef = grants;
  lastCurrentListUsersRef = users;
  lastCurrentListUserId = currentUserId;

  return result;
}
