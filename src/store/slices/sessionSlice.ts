import { SessionSlice, SetStoreState, GetStoreState } from '../types';
import { ok, fail } from '@/domain/result';
import { canViewNode } from '@/domain/permissions';
import { isEffectivelyArchived } from '@/domain/validation';
import { BaseContainer, List } from '@/domain/types';

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

export const createSessionSlice = (
  set: SetStoreState,
  get: GetStoreState
): SessionSlice => ({
  currentUserId: 'user-alice',
  selectedListId: 'list-1',
  simulateFailure: false,

  setSimulateFailure: (enabled: boolean) => {
    set(() => ({ simulateFailure: enabled }));
  },

  setCurrentUser: (userId: string) => {
    const state = get();
    const user = state.users[userId];
    if (!user) {
      return fail('NOT_FOUND', `User '${userId}' not found`);
    }

    set(() => ({ currentUserId: userId }));
    return ok(user);
  },

  setSelectedList: (listId: string | null) => {
    if (listId === null) {
      set(() => ({ selectedListId: null }));
      return ok(undefined);
    }

    const state = get();
    const list = state.lists[listId];
    if (!list) {
      return fail('NOT_FOUND', `List '${listId}' not found`);
    }

    set(() => ({ selectedListId: listId }));
    return ok(undefined);
  },

  selectList: (listId: string) => {
    const state = get();
    const allNodes = getAllNodes(state);
    const node = allNodes[listId];

    // 1. NOT_FOUND
    if (!node) {
      return fail('NOT_FOUND', `List '${listId}' not found`);
    }

    // 2. FORBIDDEN (canViewNode, covers corrupt hierarchy too; denied node never reveals type or archive state)
    const currentUser = state.users[state.currentUserId];
    const permState = {
      nodes: allNodes,
      grants: Array.isArray(state.grants)
        ? state.grants
        : Object.values(state.grants),
    };

    if (!canViewNode(currentUser, listId, permState)) {
      return fail('FORBIDDEN', 'Access denied to list');
    }

    // 3. VALIDATION (non-list)
    if (node.type !== 'list') {
      return fail('VALIDATION', 'Selected container is not a list');
    }

    // 4. CONFLICT (archived or effectively archived)
    if (isEffectivelyArchived(listId, allNodes)) {
      return fail('CONFLICT', 'List is archived');
    }

    // Success: updates selectedListId and returns ok(node as List)
    set(() => ({ selectedListId: listId }));
    return ok(node as List);
  },

  clearSelection: () => {
    set(() => ({ selectedListId: null }));
    return ok(undefined);
  },
});
