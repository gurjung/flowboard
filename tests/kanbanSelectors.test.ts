import { describe, it, expect } from 'vitest';
import { createSeedState } from '@/domain/fixtures';
import {
  selectKanbanColumns,
  selectCanEditCurrentList,
} from '@/domain/kanbanSelectors';
import { FlowboardStoreState } from '@/store/types';

function createMockStoreState(
  overrides?: Partial<FlowboardStoreState>
): FlowboardStoreState {
  const seed = createSeedState();
  return {
    ...seed,
    ...overrides,
  } as FlowboardStoreState;
}

describe('selectKanbanColumns & selectCanEditCurrentList selectors', () => {
  it('returns NOT_FOUND when selectedListId is null', () => {
    const state = createMockStoreState({ selectedListId: null });
    const result = selectKanbanColumns(state);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns FORBIDDEN when user has no view access to list', () => {
    // Carol is denied on list-2
    const state = createMockStoreState({
      currentUserId: 'user-carol',
      selectedListId: 'list-2',
    });
    const result = selectKanbanColumns(state);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('returns CONFLICT when list is archived', () => {
    const base = createMockStoreState();
    const state = {
      ...base,
      selectedListId: 'list-1',
      lists: {
        ...base.lists,
        'list-1': {
          ...base.lists['list-1']!,
          archivedAt: '2026-10-10T00:00:00.000Z',
        },
      },
    };
    const result = selectKanbanColumns(state);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('CONFLICT');
    }
  });

  it('returns columns for every status on the list, including empty ones', () => {
    const state = createMockStoreState({ selectedListId: 'list-1' });
    const result = selectKanbanColumns(state);
    expect(result.success).toBe(true);
    if (result.success) {
      const cols = result.data;
      // list-1 has 4 statuses: todo, prog, qa, done
      expect(cols).toHaveLength(4);
      expect(cols.map((c) => c.status.id)).toEqual([
        'status-1-todo',
        'status-1-prog',
        'status-1-qa',
        'status-1-done',
      ]);
      // qa was newly added with 0 tasks initially
      const qaCol = cols.find((c) => c.status.id === 'status-1-qa');
      expect(qaCol?.tasks).toEqual([]);
    }
  });

  it('preserves array reference for untouched columns when only one column changes', () => {
    const state1 = createMockStoreState({ selectedListId: 'list-1' });
    const result1 = selectKanbanColumns(state1);
    expect(result1.success).toBe(true);
    if (!result1.success) return;

    // Mutate only task-1 in status-1-todo
    const state2: FlowboardStoreState = {
      ...state1,
      tasks: {
        ...state1.tasks,
        'task-1': {
          ...state1.tasks['task-1']!,
          title: 'Updated title',
        },
      },
    };

    const result2 = selectKanbanColumns(state2);
    expect(result2.success).toBe(true);
    if (!result2.success) return;

    const progCol1 = result1.data.find((c) => c.status.id === 'status-1-prog');
    const progCol2 = result2.data.find((c) => c.status.id === 'status-1-prog');

    // Untouched in_progress tasks array must retain identical reference
    expect(progCol2?.tasks).toBe(progCol1?.tasks);
  });

  describe('selectCanEditCurrentList RBAC capabilities', () => {
    it('returns true for Alice on list-1, list-2, and list-3', () => {
      const state = createMockStoreState({ currentUserId: 'user-alice' });
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-1' })
      ).toBe(true);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-2' })
      ).toBe(true);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-3' })
      ).toBe(true);
    });

    it('returns true for Bob on list-1 and list-2, but false on list-3', () => {
      const state = createMockStoreState({ currentUserId: 'user-bob' });
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-1' })
      ).toBe(true);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-2' })
      ).toBe(true);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-3' })
      ).toBe(false);
    });

    it('returns true for Carol on list-1 and list-3, but false on list-2', () => {
      const state = createMockStoreState({ currentUserId: 'user-carol' });
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-1' })
      ).toBe(true);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-2' })
      ).toBe(false);
      expect(
        selectCanEditCurrentList({ ...state, selectedListId: 'list-3' })
      ).toBe(true);
    });

    it('returns false when selectedListId is null', () => {
      const state = createMockStoreState({
        currentUserId: 'user-alice',
        selectedListId: null,
      });
      expect(selectCanEditCurrentList(state)).toBe(false);
    });
  });
});
