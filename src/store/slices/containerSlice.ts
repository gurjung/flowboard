import {
  FlowboardStoreState,
  ContainerSyncSlice,
  CreateContainerInput,
  StoreDeps,
  SetStoreState,
  GetStoreState,
} from '../types';
import {
  BaseContainer,
  Workspace,
  Space,
  Folder,
  List,
  Visibility,
} from '@/domain/types';
import { ok, fail, Result } from '@/domain/result';
import { canManageContainers, getAncestorChain } from '@/domain/permissions';
import {
  validateContainerName,
  isValidParentType,
  getArchiveStatus,
} from '@/domain/validation';
import {
  sortPositionables,
  reindexPositions,
  reorderItems,
} from '@/domain/ordering';

export function getAllNodes(
  state: FlowboardStoreState
): Record<string, BaseContainer> {
  return {
    ...state.workspaces,
    ...state.spaces,
    ...state.folders,
    ...state.lists,
  };
}

export const createContainerSyncSlice = (
  set: SetStoreState,
  get: GetStoreState,
  deps: StoreDeps
): ContainerSyncSlice => ({
  createContainerSync: (input: CreateContainerInput): Result<BaseContainer> => {
    const state = get();

    // Tier 1: Permission check (Admin only, fail closed if session invalid)
    const currentUser = state.users[state.currentUserId];
    if (!currentUser) {
      return fail('FORBIDDEN', 'User session is invalid or user not found');
    }
    if (!canManageContainers(currentUser)) {
      return fail('FORBIDDEN', 'Only administrators can create containers');
    }

    // Tier 2: Existence & Root constraints
    if (input.type === 'workspace') {
      return fail(
        'INVALID_PARENT',
        'Workspaces cannot be created via createContainer'
      );
    }

    if (!input.parentId) {
      return fail('NOT_FOUND', 'Parent ID is required');
    }

    const allNodes = getAllNodes(state);
    const parentNode = allNodes[input.parentId];
    if (!parentNode) {
      return fail(
        'NOT_FOUND',
        `Parent container '${input.parentId}' not found`
      );
    }

    // Tier 3: Hierarchy type validation
    if (!isValidParentType(input.type, parentNode.type)) {
      return fail(
        'INVALID_PARENT',
        `Cannot create container of type '${input.type}' under parent of type '${parentNode.type}'`
      );
    }

    // Tier 4: Validation (Container name)
    const nameResult = validateContainerName(input.name);
    if (!nameResult.success) {
      return nameResult;
    }
    const trimmedName = nameResult.data;

    // Tier 5: Lifecycle & Archive conflict
    const parentArchiveStatus = getArchiveStatus(input.parentId, allNodes);
    if (parentArchiveStatus === 'corrupt') {
      return fail('CONFLICT', 'Corrupt container hierarchy');
    }
    if (parentArchiveStatus === 'archived') {
      return fail(
        'CONFLICT',
        'Cannot create container under an archived parent'
      );
    }

    // Sibling positioning (append to active siblings)
    const activeSiblings = Object.values(allNodes).filter(
      (n) => n.parentId === input.parentId && n.archivedAt === null
    );
    const position = activeSiblings.length;

    const id = deps.newId();
    const now = deps.now();
    const visibility: Visibility = input.visibility ?? 'public';

    if (input.type === 'space') {
      const newSpace: Space = {
        id,
        name: trimmedName,
        type: 'space',
        parentId: input.parentId,
        position,
        visibility,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({
        spaces: { ...s.spaces, [id]: newSpace },
      }));
      return ok(newSpace);
    }

    if (input.type === 'folder') {
      const newFolder: Folder = {
        id,
        name: trimmedName,
        type: 'folder',
        parentId: input.parentId,
        position,
        visibility,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({
        folders: { ...s.folders, [id]: newFolder },
      }));
      return ok(newFolder);
    }

    if (input.type === 'list') {
      const newList: List = {
        id,
        name: trimmedName,
        type: 'list',
        parentId: input.parentId,
        position,
        visibility,
        archivedAt: null,
        statusIds: [],
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({
        lists: { ...s.lists, [id]: newList },
      }));
      return ok(newList);
    }

    return fail('INVALID_PARENT', `Unsupported container type '${input.type}'`);
  },

  renameContainerSync: (id: string, name: string): Result<BaseContainer> => {
    const state = get();

    // Tier 1: Permission check
    const currentUser = state.users[state.currentUserId];
    if (!currentUser) {
      return fail('FORBIDDEN', 'User session is invalid or user not found');
    }
    if (!canManageContainers(currentUser)) {
      return fail('FORBIDDEN', 'Only administrators can rename containers');
    }

    // Tier 2: Existence check
    const allNodes = getAllNodes(state);
    const target = allNodes[id];
    if (!target) {
      return fail('NOT_FOUND', `Container '${id}' not found`);
    }

    // Tier 4: Validation (Name)
    const nameResult = validateContainerName(name);
    if (!nameResult.success) {
      return nameResult;
    }
    const trimmedName = nameResult.data;

    // Tier 5: Lifecycle & Archive conflict
    const archiveStatus = getArchiveStatus(id, allNodes);
    if (archiveStatus === 'corrupt') {
      return fail('CONFLICT', 'Corrupt container hierarchy');
    }
    if (archiveStatus === 'archived') {
      return fail('CONFLICT', 'Cannot rename an archived container');
    }

    // No-op if name is already identical
    if (target.name === trimmedName) {
      return ok(target);
    }

    const now = deps.now();
    const updated: BaseContainer = {
      ...target,
      name: trimmedName,
      updatedAt: now,
    };

    switch (target.type) {
      case 'workspace':
        set((s) => ({
          workspaces: { ...s.workspaces, [id]: updated as Workspace },
        }));
        break;
      case 'space':
        set((s) => ({
          spaces: { ...s.spaces, [id]: updated as Space },
        }));
        break;
      case 'folder':
        set((s) => ({
          folders: { ...s.folders, [id]: updated as Folder },
        }));
        break;
      case 'list':
        set((s) => ({
          lists: { ...s.lists, [id]: updated as List },
        }));
        break;
    }

    return ok(updated);
  },

  reorderContainerSync: (id: string, newIndex: number): Result<void> => {
    const state = get();

    // Tier 1: Permission check
    const currentUser = state.users[state.currentUserId];
    if (!currentUser) {
      return fail('FORBIDDEN', 'User session is invalid or user not found');
    }
    if (!canManageContainers(currentUser)) {
      return fail('FORBIDDEN', 'Only administrators can reorder containers');
    }

    // Tier 2: Existence check
    const allNodes = getAllNodes(state);
    const target = allNodes[id];
    if (!target) {
      return fail('NOT_FOUND', `Container '${id}' not found`);
    }

    // Tier 4: Validation (Workspaces cannot be reordered)
    if (target.type === 'workspace') {
      return fail('VALIDATION', 'Workspaces cannot be reordered');
    }

    if (
      typeof newIndex !== 'number' ||
      !Number.isInteger(newIndex) ||
      newIndex < 0
    ) {
      return fail('VALIDATION', 'Target index must be a non-negative integer');
    }

    const activeSiblings = Object.values(allNodes).filter(
      (n) => n.parentId === target.parentId && n.archivedAt === null
    );
    const sortedSiblings = sortPositionables(activeSiblings);

    if (newIndex >= sortedSiblings.length) {
      return fail(
        'VALIDATION',
        `Target index ${newIndex} is out of bounds (active sibling count: ${sortedSiblings.length})`
      );
    }

    // Tier 5: Lifecycle & Archive conflict
    const archiveStatus = getArchiveStatus(id, allNodes);
    if (archiveStatus === 'corrupt') {
      return fail('CONFLICT', 'Corrupt container hierarchy');
    }
    if (archiveStatus === 'archived') {
      return fail('CONFLICT', 'Cannot reorder an archived container');
    }

    const reordered = reorderItems(sortedSiblings, id, newIndex);
    if (!reordered) {
      return fail('VALIDATION', 'Failed to reorder items');
    }

    // Same-index reorder is a no-op: preserve exact state reference
    if (reordered === sortedSiblings) {
      return ok(undefined);
    }

    const updates: Record<string, BaseContainer> = {};
    for (const item of reordered) {
      const existing = allNodes[item.id];
      if (existing && existing.position !== item.position) {
        updates[item.id] = { ...existing, position: item.position };
      }
    }

    if (Object.keys(updates).length > 0) {
      switch (target.type) {
        case 'space':
          set((s) => ({
            spaces: {
              ...s.spaces,
              ...(updates as Record<string, Space>),
            },
          }));
          break;
        case 'folder':
          set((s) => ({
            folders: {
              ...s.folders,
              ...(updates as Record<string, Folder>),
            },
          }));
          break;
        case 'list':
          set((s) => ({
            lists: {
              ...s.lists,
              ...(updates as Record<string, List>),
            },
          }));
          break;
      }
    }

    return ok(undefined);
  },

  archiveContainerSync: (id: string): Result<BaseContainer> => {
    const state = get();

    // Tier 1: Permission check
    const currentUser = state.users[state.currentUserId];
    if (!currentUser) {
      return fail('FORBIDDEN', 'User session is invalid or user not found');
    }
    if (!canManageContainers(currentUser)) {
      return fail('FORBIDDEN', 'Only administrators can archive containers');
    }

    // Tier 2: Existence check
    const allNodes = getAllNodes(state);
    const target = allNodes[id];
    if (!target) {
      return fail('NOT_FOUND', `Container '${id}' not found`);
    }

    // Tier 4: Validation (Workspaces cannot be archived)
    if (target.type === 'workspace') {
      return fail('VALIDATION', 'Workspaces cannot be archived');
    }

    // Tier 5: Lifecycle & Archive conflict
    const archiveStatus = getArchiveStatus(id, allNodes);
    if (archiveStatus === 'corrupt') {
      return fail('CONFLICT', 'Corrupt container hierarchy');
    }
    if (archiveStatus === 'archived') {
      return fail('CONFLICT', 'Container is already archived');
    }

    const now = deps.now();
    const updatedTarget: BaseContainer = {
      ...target,
      archivedAt: now,
      updatedAt: now,
    };

    // Reindex remaining active siblings under same parent
    const remainingActiveSiblings = Object.values(allNodes).filter(
      (n) =>
        n.parentId === target.parentId && n.id !== id && n.archivedAt === null
    );
    const reindexed = reindexPositions(remainingActiveSiblings);

    const siblingUpdates: Record<string, BaseContainer> = {};
    for (const item of reindexed) {
      const existing = allNodes[item.id];
      if (existing && existing.position !== item.position) {
        siblingUpdates[item.id] = { ...existing, position: item.position };
      }
    }

    // Descendants remain untouched and reference-equal
    switch (target.type) {
      case 'space':
        set((s) => ({
          spaces: {
            ...s.spaces,
            ...(siblingUpdates as Record<string, Space>),
            [id]: updatedTarget as Space,
          },
        }));
        break;
      case 'folder':
        set((s) => ({
          folders: {
            ...s.folders,
            ...(siblingUpdates as Record<string, Folder>),
            [id]: updatedTarget as Folder,
          },
        }));
        break;
      case 'list':
        set((s) => ({
          lists: {
            ...s.lists,
            ...(siblingUpdates as Record<string, List>),
            [id]: updatedTarget as List,
          },
        }));
        break;
    }

    return ok(updatedTarget);
  },

  restoreContainerSync: (id: string): Result<BaseContainer> => {
    const state = get();

    // Tier 1: Permission check
    const currentUser = state.users[state.currentUserId];
    if (!currentUser) {
      return fail('FORBIDDEN', 'User session is invalid or user not found');
    }
    if (!canManageContainers(currentUser)) {
      return fail('FORBIDDEN', 'Only administrators can restore containers');
    }

    // Tier 2: Existence check
    const allNodes = getAllNodes(state);
    const target = allNodes[id];
    if (!target) {
      return fail('NOT_FOUND', `Container '${id}' not found`);
    }

    // Hierarchy / cycle validation
    const chain = getAncestorChain(id, { nodes: allNodes, grants: [] });
    if (!chain) {
      return fail('CONFLICT', 'Corrupt container hierarchy');
    }

    // Tier 4: Validation
    if (target.type === 'workspace') {
      return fail('VALIDATION', 'Workspaces cannot be restored');
    }

    // Tier 5: Restore-specific lifecycle guards
    // Guard 5a: Node's OWN archivedAt check
    if (target.archivedAt === null) {
      return fail('CONFLICT', 'Container is already active');
    }

    // Guard 5b: Any ancestor archived check
    const ancestors = chain.slice(0, -1);
    const hasArchivedAncestor = ancestors.some((a) => a.archivedAt !== null);
    if (hasArchivedAncestor) {
      return fail(
        'CONFLICT',
        'Cannot restore container under an archived ancestor. Restore parent first.'
      );
    }

    // Append at end of active siblings under same parent
    const activeSiblings = Object.values(allNodes).filter(
      (n) =>
        n.parentId === target.parentId && n.id !== id && n.archivedAt === null
    );
    const newPosition = activeSiblings.length;

    const now = deps.now();
    const updatedTarget: BaseContainer = {
      ...target,
      archivedAt: null,
      position: newPosition,
      updatedAt: now,
    };

    switch (target.type) {
      case 'space':
        set((s) => ({
          spaces: { ...s.spaces, [id]: updatedTarget as Space },
        }));
        break;
      case 'folder':
        set((s) => ({
          folders: { ...s.folders, [id]: updatedTarget as Folder },
        }));
        break;
      case 'list':
        set((s) => ({
          lists: { ...s.lists, [id]: updatedTarget as List },
        }));
        break;
    }

    return ok(updatedTarget);
  },
});
