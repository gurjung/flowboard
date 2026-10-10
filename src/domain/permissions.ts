import { BaseContainer, Grant, SeedState, User } from './types';

export interface PermissionState {
  nodes: Record<string, BaseContainer>;
  grants: Record<string, Grant> | Grant[];
}

/**
 * Normalizes a SeedState into a PermissionState with a flat node dictionary.
 */
export function toPermissionState(seedState: SeedState): PermissionState {
  return {
    nodes: {
      ...seedState.workspaces,
      ...seedState.spaces,
      ...seedState.folders,
      ...seedState.lists,
    },
    grants: seedState.grants,
  };
}

/**
 * Traverses from root to the specified node, returning the ordered ancestor chain:
 * [Workspace, Space, Folder, List] (or shorter, depending on target node type).
 * Returns `null` if the node does not exist, has broken parent links, or contains a cycle.
 */
export function getAncestorChain(
  nodeId: string,
  state: PermissionState
): BaseContainer[] | null {
  if (!nodeId || !state || !state.nodes) {
    return null;
  }

  const target = state.nodes[nodeId];
  if (!target) {
    return null;
  }

  const chain: BaseContainer[] = [];
  const visited = new Set<string>();
  let current: BaseContainer | undefined = target;

  while (current) {
    if (visited.has(current.id)) {
      // Cycle detected - fail closed
      return null;
    }
    visited.add(current.id);
    chain.unshift(current); // prepend so chain is ordered [root, ..., target]

    if (current.parentId === null) {
      break;
    }

    const parent: BaseContainer | undefined = state.nodes[current.parentId];
    if (!parent) {
      // Broken parent link - fail closed
      return null;
    }

    current = parent;
  }

  // Ensure root is a valid root (parentId is null)
  const root = chain[0];
  if (!root || root.parentId !== null) {
    return null;
  }

  return chain;
}

/**
 * Evaluates whether a user can view a given container node.
 * Pure function: fails closed on invalid users, missing nodes, or broken hierarchies.
 */
export function canViewNode(
  user: User | null | undefined,
  nodeId: string,
  state: PermissionState
): boolean {
  if (!user || !user.id || !user.role) {
    return false;
  }

  const chain = getAncestorChain(nodeId, state);
  if (!chain) {
    return false;
  }

  // Admins bypass all grants and private barriers on valid existing nodes
  if (user.role === 'admin') {
    return true;
  }

  const grantsList = Array.isArray(state.grants)
    ? state.grants
    : Object.values(state.grants);
  const userGrants = grantsList.filter((g) => g && g.userId === user.id);

  // 1. Subtree Deny Check:
  // An explicit deny on ANY node in the ancestor chain immediately hides the whole subtree
  const hasSubtreeDeny = chain.some((node) =>
    userGrants.some((g) => g.mode === 'deny' && g.resourceId === node.id)
  );
  if (hasSubtreeDeny) {
    return false;
  }

  // 2. Private Container Barrier Check:
  // An allow only flows downward; an allow on a descendant never unlocks a private ancestor.
  // For every private node P in the chain, require an explicit allow on P or an ancestor of P.
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    if (node && node.visibility === 'private') {
      const allowedNodeOrAncestor = chain
        .slice(0, i + 1)
        .some((ancestor) =>
          userGrants.some(
            (g) => g.mode === 'allow' && g.resourceId === ancestor.id
          )
        );

      if (!allowedNodeOrAncestor) {
        return false;
      }
    }
  }

  // 3. Default Public Access:
  // If not denied and not blocked by any ungranted private container, access is granted.
  return true;
}

/**
 * Evaluates whether a user can edit tasks within a given list.
 * In the domain model, write access to tasks in a list requires view access to that list.
 */
export function canEditTasksInList(
  user: User | null | undefined,
  listId: string,
  state: PermissionState
): boolean {
  if (!canViewNode(user, listId, state)) {
    return false;
  }

  const node = state.nodes[listId];
  if (!node || node.type !== 'list') {
    return false;
  }

  return true;
}

/**
 * Evaluates whether a user has administrative capabilities to mutate containers
 * (create, rename, reorder, archive containers) or configure list statuses.
 * Per D-013, container mutations and status configuration are admin-only.
 */
export function canManageContainers(user: User | null | undefined): boolean {
  return Boolean(user && user.role === 'admin');
}

/**
 * Evaluates whether a user can move a task from a source list to a target list.
 * Per D-014, moving tasks requires write access to BOTH the source and target lists.
 */
export function canMoveTask(
  user: User | null | undefined,
  sourceListId: string,
  targetListId: string,
  state: PermissionState
): boolean {
  if (!sourceListId || !targetListId) {
    return false;
  }

  return (
    canEditTasksInList(user, sourceListId, state) &&
    canEditTasksInList(user, targetListId, state)
  );
}
