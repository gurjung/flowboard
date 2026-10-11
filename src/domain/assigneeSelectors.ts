import { User, BaseContainer, Grant } from './types';
import { canViewNode, PermissionState } from './permissions';

export interface StateForAssigneeSelectors {
  workspaces?: Record<string, BaseContainer>;
  spaces?: Record<string, BaseContainer>;
  folders?: Record<string, BaseContainer>;
  lists?: Record<string, BaseContainer>;
  grants?: Record<string, Grant> | Grant[];
  users?: Record<string, User>;
}

function getAllNodes(
  state: StateForAssigneeSelectors
): Record<string, BaseContainer> {
  return {
    ...state.workspaces,
    ...state.spaces,
    ...state.folders,
    ...state.lists,
  };
}

/**
 * Lists only users who have permission to view the given list.
 * Evaluates access via pure canViewNode, never role.
 */
export function selectAssignableUsersForList(
  state: StateForAssigneeSelectors,
  listId: string
): User[] {
  const allNodes = getAllNodes(state);
  const targetNode = allNodes[listId];
  if (!targetNode || targetNode.type !== 'list') {
    return [];
  }

  const grants = state.grants;
  const users = state.users ?? {};
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(grants) ? grants : Object.values(grants ?? {}),
  };

  return Object.values(users)
    .filter((user) => canViewNode(user, listId, permState))
    .sort((a, b) => a.name.localeCompare(b.name));
}
