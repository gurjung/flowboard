import { Status, BaseContainer, User, Grant } from './types';
import { Result, ok, fail } from './result';
import { canViewNode, PermissionState } from './permissions';
import { getArchiveStatus } from './validation';

export interface StateForStatusSelectors {
  workspaces?: Record<string, BaseContainer>;
  spaces?: Record<string, BaseContainer>;
  folders?: Record<string, BaseContainer>;
  lists?: Record<string, BaseContainer>;
  statuses?: Record<string, Status>;
  grants?: Record<string, Grant> | Grant[];
  users?: Record<string, User>;
  currentUserId?: string;
}

function getAllNodes(
  state: StateForStatusSelectors
): Record<string, BaseContainer> {
  return {
    ...state.workspaces,
    ...state.spaces,
    ...state.folders,
    ...state.lists,
  };
}

interface ListCacheEntry {
  stateRef: StateForStatusSelectors;
  result: Result<Status[]>;
}

interface IdCacheEntry {
  stateRef: StateForStatusSelectors;
  result: Result<Status>;
}

const listCache = new Map<string, ListCacheEntry>();
const idCache = new Map<string, IdCacheEntry>();

export function selectStatusesForList(
  state: StateForStatusSelectors,
  listId: string
): Result<Status[]> {
  const cached = listCache.get(listId);
  if (cached && cached.stateRef === state) {
    return cached.result;
  }

  const allNodes = getAllNodes(state);
  const currentUser = state.users?.[state.currentUserId ?? ''];
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(state.grants)
      ? state.grants
      : Object.values(state.grants ?? {}),
  };

  const node = allNodes[listId];
  if (!node) {
    const res = fail<Status[]>('NOT_FOUND', `List '${listId}' not found`);
    listCache.set(listId, { stateRef: state, result: res });
    return res;
  }

  if (!canViewNode(currentUser, listId, permState)) {
    const res = fail<Status[]>(
      'FORBIDDEN',
      `Cannot view containers in '${listId}'`
    );
    listCache.set(listId, { stateRef: state, result: res });
    return res;
  }

  if (node.type !== 'list') {
    const res = fail<Status[]>(
      'VALIDATION',
      `Target container '${listId}' is not a list`
    );
    listCache.set(listId, { stateRef: state, result: res });
    return res;
  }

  if (getArchiveStatus(listId, allNodes) !== 'active') {
    const res = fail<Status[]>(
      'CONFLICT',
      `Cannot view statuses in archived list '${listId}'`
    );
    listCache.set(listId, { stateRef: state, result: res });
    return res;
  }

  const statuses = Object.values(state.statuses ?? {})
    .filter((s) => s.listId === listId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  const res = ok(statuses);
  listCache.set(listId, { stateRef: state, result: res });
  return res;
}

export function selectStatusById(
  state: StateForStatusSelectors,
  statusId: string
): Result<Status> {
  const cached = idCache.get(statusId);
  if (cached && cached.stateRef === state) {
    return cached.result;
  }

  const status = state.statuses?.[statusId];
  if (!status) {
    const res = fail<Status>('NOT_FOUND', `Status '${statusId}' not found`);
    idCache.set(statusId, { stateRef: state, result: res });
    return res;
  }

  const allNodes = getAllNodes(state);
  const currentUser = state.users?.[state.currentUserId ?? ''];
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(state.grants)
      ? state.grants
      : Object.values(state.grants ?? {}),
  };

  // Zero-leakage: verify view permission before returning status
  const listNode = allNodes[status.listId];
  if (!listNode || !canViewNode(currentUser, status.listId, permState)) {
    const res = fail<Status>('FORBIDDEN', 'Access denied to status list');
    idCache.set(statusId, { stateRef: state, result: res });
    return res;
  }

  if (listNode.type !== 'list') {
    const res = fail<Status>(
      'VALIDATION',
      `Parent container '${status.listId}' is not a list`
    );
    idCache.set(statusId, { stateRef: state, result: res });
    return res;
  }

  if (getArchiveStatus(status.listId, allNodes) !== 'active') {
    const res = fail<Status>(
      'CONFLICT',
      `Status belongs to an archived list '${status.listId}'`
    );
    idCache.set(statusId, { stateRef: state, result: res });
    return res;
  }

  const res = ok(status);
  idCache.set(statusId, { stateRef: state, result: res });
  return res;
}
