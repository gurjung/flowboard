import { SessionSlice, SetStoreState, GetStoreState } from '../types';
import { ok, fail } from '@/domain/result';

export const createSessionSlice = (
  set: SetStoreState,
  get: GetStoreState
): SessionSlice => ({
  currentUserId: 'user-alice',
  selectedListId: 'list-1',

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
});
