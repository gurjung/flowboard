import {
  BaseContainer,
  ContainerType,
  List,
  SeedState,
  Visibility,
  Task,
} from './types';
import { Result, ok, fail } from './result';
import { canViewNode, getAncestorChain } from './permissions';
import { isEffectivelyArchived } from './validation';
import { sortPositionables } from './ordering';

export interface TreeNode {
  id: string;
  name: string;
  type: ContainerType;
  parentId: string | null;
  position: number;
  visibility: Visibility;
  children: TreeNode[];
}

export interface DescendantCounts {
  containerCount: number;
  taskCount: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: ContainerType;
}

export function getChildType(parentType: ContainerType): ContainerType | null {
  switch (parentType) {
    case 'workspace':
      return 'space';
    case 'space':
      return 'folder';
    case 'folder':
      return 'list';
    default:
      return null;
  }
}

export type StateSubsetForTree = Pick<
  SeedState,
  | 'workspaces'
  | 'spaces'
  | 'folders'
  | 'lists'
  | 'grants'
  | 'users'
  | 'currentUserId'
>;

export type StateSubsetForList = StateSubsetForTree &
  Pick<SeedState, 'selectedListId'>;

function getAllNodes(state: {
  workspaces?: Record<string, BaseContainer>;
  spaces?: Record<string, BaseContainer>;
  folders?: Record<string, BaseContainer>;
  lists?: Record<string, BaseContainer>;
}): Record<string, BaseContainer> {
  return {
    ...state.workspaces,
    ...state.spaces,
    ...state.folders,
    ...state.lists,
  };
}

// ============================================================================
// Memoized selectVisibleContainerTree
// ============================================================================

let lastTreeNodesRef: Record<string, BaseContainer> | null = null;
let lastTreeGrantsRef: unknown = null;
let lastTreeUsersRef: unknown = null;
let lastTreeUserId: string | null = null;
let cachedVisibleTree: TreeNode[] | null = null;

/**
 * Builds the visible hierarchical container tree top-down:
 * - Prunes invisible subtrees without calling canViewNode on descendants.
 * - Hides all archived nodes and subtrees for all users (including admins).
 * - Sorts active siblings by position ascending, then id ascending.
 * - Memoized strictly on references of (nodes, grants, users, currentUserId).
 */
export function selectVisibleContainerTree(
  state: StateSubsetForTree
): TreeNode[] {
  const allNodes = getAllNodes(state);
  const grants = state.grants;
  const users = state.users;
  const currentUserId = state.currentUserId;

  // Check if all 4 dependency references match cache
  if (
    cachedVisibleTree !== null &&
    lastTreeNodesRef !== null &&
    areNodesReferenceEqual(lastTreeNodesRef, allNodes) &&
    lastTreeGrantsRef === grants &&
    lastTreeUsersRef === users &&
    lastTreeUserId === currentUserId
  ) {
    return cachedVisibleTree;
  }

  const currentUser = users[currentUserId];
  const permState = {
    nodes: allNodes,
    grants: Array.isArray(grants) ? grants : Object.values(grants),
  };

  // Group active nodes by parentId
  const activeChildrenByParent = new Map<string | null, BaseContainer[]>();
  for (const node of Object.values(allNodes)) {
    // Hidden if node itself has archivedAt !== null
    if (node.archivedAt !== null) {
      continue;
    }
    const parentKey = node.parentId;
    const existing = activeChildrenByParent.get(parentKey) ?? [];
    existing.push(node);
    activeChildrenByParent.set(parentKey, existing);
  }

  // Recursive top-down builder: prunes if canViewNode returns false
  function buildSubtree(parentId: string | null): TreeNode[] {
    const rawSiblings = activeChildrenByParent.get(parentId) ?? [];
    const sorted = sortPositionables(rawSiblings);
    const result: TreeNode[] = [];

    for (const node of sorted) {
      // Top-down pruning: evaluate canViewNode on current node
      if (!canViewNode(currentUser, node.id, permState)) {
        continue; // Prune this entire branch without checking its children
      }

      const children = buildSubtree(node.id);
      result.push({
        id: node.id,
        name: node.name,
        type: node.type,
        parentId: node.parentId,
        position: node.position,
        visibility: node.visibility,
        children,
      });
    }

    return result;
  }

  const newTree = buildSubtree(null);

  // Update memoization cache
  lastTreeNodesRef = allNodes;
  lastTreeGrantsRef = grants;
  lastTreeUsersRef = users;
  lastTreeUserId = currentUserId;
  cachedVisibleTree = newTree;

  return newTree;
}

function areNodesReferenceEqual(
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

// ============================================================================
// Memoized selectCurrentList
// ============================================================================

let lastListNodesRef: Record<string, BaseContainer> | null = null;
let lastListGrantsRef: unknown = null;
let lastListUsersRef: unknown = null;
let lastListUserId: string | null = null;
let lastSelectedListId: string | null = null;
let cachedCurrentListResult: Result<List | null> | null = null;

const EMPTY_SELECTION_RESULT: Result<List | null> = ok(null);

/**
 * Returns Result<List | null> for the currently selected list:
 * - selectedListId === null -> ok(null) (neutral, not an error)
 * - non-null id with missing -> fail('NOT_FOUND')
 * - non-null id with forbidden -> fail('FORBIDDEN') (covers corrupt hierarchy too)
 * - non-null id with non-list -> fail('VALIDATION')
 * - non-null id with archived/effectively archived -> fail('CONFLICT')
 * - valid -> ok(list)
 * Memoized on references of (nodes, grants, users, currentUserId, selectedListId).
 * Never creates a fresh Result inside a Zustand selector on identical inputs.
 */
export function selectCurrentList(
  state: StateSubsetForList
): Result<List | null> {
  const allNodes = getAllNodes(state);
  const grants = state.grants;
  const users = state.users;
  const currentUserId = state.currentUserId;
  const selectedListId = state.selectedListId;

  if (
    cachedCurrentListResult !== null &&
    lastListNodesRef !== null &&
    areNodesReferenceEqual(lastListNodesRef, allNodes) &&
    lastListGrantsRef === grants &&
    lastListUsersRef === users &&
    lastListUserId === currentUserId &&
    lastSelectedListId === selectedListId
  ) {
    return cachedCurrentListResult;
  }

  let result: Result<List | null>;

  if (selectedListId === null) {
    result = EMPTY_SELECTION_RESULT;
  } else {
    const node = allNodes[selectedListId];
    if (!node) {
      result = fail('NOT_FOUND', `List '${selectedListId}' not found`);
    } else {
      const currentUser = users[currentUserId];
      const permState = {
        nodes: allNodes,
        grants: Array.isArray(grants) ? grants : Object.values(grants),
      };

      if (!canViewNode(currentUser, selectedListId, permState)) {
        result = fail('FORBIDDEN', 'Access denied to selected list');
      } else if (node.type !== 'list') {
        result = fail('VALIDATION', 'Selected container is not a list');
      } else if (isEffectivelyArchived(selectedListId, allNodes)) {
        result = fail('CONFLICT', 'Selected list is archived');
      } else {
        result = ok(node as List);
      }
    }
  }

  // Update memoization cache
  lastListNodesRef = allNodes;
  lastListGrantsRef = grants;
  lastListUsersRef = users;
  lastListUserId = currentUserId;
  lastSelectedListId = selectedListId;
  cachedCurrentListResult = result;

  return result;
}

// ============================================================================
// selectBreadcrumbs
// ============================================================================

let cachedBreadcrumbsResult: BreadcrumbItem[] | null = null;
let lastBreadcrumbsNodesRef: Record<string, BaseContainer> | null = null;
let lastBreadcrumbsGrantsRef: unknown = null;
let lastBreadcrumbsUsersRef: unknown = null;
let lastBreadcrumbsUserId: string | null = null;
let lastBreadcrumbsSelectedListId: string | null = null;

/**
 * Builds breadcrumb chain only from a successful selectCurrentList.
 * D-012 Invariant: A partial sub-path cannot occur because any accessible
 * leaf list guarantees that all private ancestors have explicit allow grants
 * and no ancestor has an explicit deny grant. The chain is all-or-nothing.
 *
 * Memoized on references of (nodes, grants, users, currentUserId, selectedListId).
 * Same inputs -> same returned BreadcrumbItem[] reference.
 */
export function selectBreadcrumbs(
  state: StateSubsetForList
): BreadcrumbItem[] | null {
  const allNodes = getAllNodes(state);
  const grants = state.grants;
  const users = state.users;
  const currentUserId = state.currentUserId;
  const selectedListId = state.selectedListId;

  if (
    lastBreadcrumbsNodesRef !== null &&
    areNodesReferenceEqual(lastBreadcrumbsNodesRef, allNodes) &&
    lastBreadcrumbsGrantsRef === grants &&
    lastBreadcrumbsUsersRef === users &&
    lastBreadcrumbsUserId === currentUserId &&
    lastBreadcrumbsSelectedListId === selectedListId
  ) {
    return cachedBreadcrumbsResult;
  }

  const listResult = selectCurrentList(state);
  let result: BreadcrumbItem[] | null = null;

  if (listResult.success && listResult.data) {
    const permState = {
      nodes: allNodes,
      grants: Array.isArray(grants) ? grants : Object.values(grants),
    };
    const chain = getAncestorChain(listResult.data.id, permState);
    if (chain) {
      result = chain.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
      }));
    }
  }

  // Update memoization cache
  lastBreadcrumbsNodesRef = allNodes;
  lastBreadcrumbsGrantsRef = grants;
  lastBreadcrumbsUsersRef = users;
  lastBreadcrumbsUserId = currentUserId;
  lastBreadcrumbsSelectedListId = selectedListId;
  cachedBreadcrumbsResult = result;

  return result;
}

// ============================================================================
// selectArchivedRoots
// ============================================================================

/**
 * Lists archived nodes whose ancestors are all active.
 * Used by admin "Archived" section to present clean restore roots without clutter.
 */
export function selectArchivedRoots(
  state: StateSubsetForTree
): BaseContainer[] {
  const allNodes = getAllNodes(state);
  const result: BaseContainer[] = [];

  for (const node of Object.values(allNodes)) {
    // Must be directly archived
    if (node.archivedAt === null) {
      continue;
    }

    // Check that ALL ancestors are active (archivedAt === null)
    let currentParentId = node.parentId;
    let allAncestorsActive = true;
    const visited = new Set<string>();

    while (currentParentId !== null) {
      if (visited.has(currentParentId)) {
        allAncestorsActive = false; // Cyclic
        break;
      }
      visited.add(currentParentId);

      const parent = allNodes[currentParentId];
      if (!parent) {
        allAncestorsActive = false; // Broken link
        break;
      }

      if (parent.archivedAt !== null) {
        allAncestorsActive = false; // Ancestor is also archived
        break;
      }

      currentParentId = parent.parentId;
    }

    if (allAncestorsActive) {
      result.push(node);
    }
  }

  return sortPositionables(result);
}

// ============================================================================
// getDescendantCounts for Archive Confirmation Dialog
// ============================================================================

/**
 * Returns count of active descendant containers AND active tasks that will be hidden
 * when archiving the specified container.
 */
export function getDescendantCounts(
  nodeId: string,
  state: {
    workspaces?: Record<string, BaseContainer>;
    spaces?: Record<string, BaseContainer>;
    folders?: Record<string, BaseContainer>;
    lists?: Record<string, BaseContainer>;
    tasks?: Record<string, Task>;
  }
): DescendantCounts {
  const allNodes = getAllNodes(state);
  const tasks = state.tasks ?? {};

  let containerCount = 0;
  let taskCount = 0;

  // Find all descendant nodes under nodeId
  const descendantListIds = new Set<string>();
  if (allNodes[nodeId]?.type === 'list') {
    descendantListIds.add(nodeId);
  }

  function traverseChildren(parentId: string) {
    for (const node of Object.values(allNodes)) {
      if (node.parentId === parentId && node.archivedAt === null) {
        containerCount++;
        if (node.type === 'list') {
          descendantListIds.add(node.id);
        }
        traverseChildren(node.id);
      }
    }
  }

  traverseChildren(nodeId);

  // Count active tasks belonging to any of the descendant lists
  for (const task of Object.values(tasks)) {
    if (task.archivedAt === null && descendantListIds.has(task.primaryListId)) {
      taskCount++;
    }
  }

  return { containerCount, taskCount };
}

export {
  selectTasksForList,
  selectTaskById,
  selectTasksForCurrentList,
} from './taskSelectors';

export { selectStatusesForList, selectStatusById } from './statusSelectors';

export {
  selectKanbanColumns,
  selectCanEditCurrentList,
} from './kanbanSelectors';

export { sortTasksForListView, nextSort, PRIORITY_RANK } from './taskSorting';
export { selectAssignableUsersForList } from './assigneeSelectors';
