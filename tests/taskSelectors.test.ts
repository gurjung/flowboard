import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectTasksForList,
  selectTaskById,
  selectTasksForCurrentList,
} from '@/domain/taskSelectors';
import { createSeedState } from '@/domain/fixtures';
import { flowboardStore } from '@/store/useFlowboardStore';

describe('Domain: Task Selectors Engine', () => {
  let seed = createSeedState();

  beforeEach(() => {
    seed = createSeedState();
    flowboardStore.setState({ ...seed });
  });

  describe('selectTasksForList', () => {
    it('returns NOT_FOUND for a nonexistent list', () => {
      const res = selectTasksForList(seed, 'nonexistent-list');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns FORBIDDEN when user cannot view list (Bob on private list-3)', () => {
      const res = selectTasksForList(
        { ...seed, currentUserId: 'user-bob' },
        'list-3'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('returns VALIDATION if target container is not a list', () => {
      const res = selectTasksForList(
        { ...seed, currentUserId: 'user-alice' },
        'folder-1'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('returns CONFLICT if list is archived', () => {
      const archivedSeed = {
        ...seed,
        lists: {
          ...seed.lists,
          'list-1': {
            ...seed.lists['list-1']!,
            archivedAt: '2026-10-11T00:00:00.000Z',
          },
        },
      };
      const res = selectTasksForList(
        { ...archivedSeed, currentUserId: 'user-alice' },
        'list-1'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CONFLICT');
    });

    it('returns active tasks sorted by position ascending, then id', () => {
      const res = selectTasksForList(
        { ...seed, currentUserId: 'user-alice' },
        'list-1'
      );
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(6);
      // All returned tasks are active and belong to list-1
      for (const t of res.data!) {
        expect(t.primaryListId).toBe('list-1');
        expect(t.archivedAt).toBeNull();
      }
    });

    it('memoizes on references: same inputs -> exact same Result reference', () => {
      const res1 = selectTasksForList(seed, 'list-1');
      const res2 = selectTasksForList(seed, 'list-1');
      expect(res1).toBe(res2);
    });
  });

  describe('selectTaskById', () => {
    it('returns NOT_FOUND for nonexistent task', () => {
      const res = selectTaskById(seed, 'task-nonexistent');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns FORBIDDEN when user cannot view parent list (Bob on task-12 in list-3)', () => {
      const res = selectTaskById(
        { ...seed, currentUserId: 'user-bob' },
        'task-12'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('CRITICAL: Bob on deleted list-3 task returns FORBIDDEN, not NOT_FOUND', () => {
      const deletedList3Seed = {
        ...seed,
        tasks: {
          ...seed.tasks,
          'task-12': {
            ...seed.tasks['task-12']!,
            archivedAt: '2026-10-11T00:00:00.000Z',
          },
        },
      };
      const res = selectTaskById(
        { ...deletedList3Seed, currentUserId: 'user-bob' },
        'task-12'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('returns NOT_FOUND for a deleted task when user has permission', () => {
      const deletedSeed = {
        ...seed,
        tasks: {
          ...seed.tasks,
          'task-1': {
            ...seed.tasks['task-1']!,
            archivedAt: '2026-10-11T00:00:00.000Z',
          },
        },
      };
      const res = selectTaskById(
        { ...deletedSeed, currentUserId: 'user-alice' },
        'task-1'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns ok(task) when active and accessible', () => {
      const res = selectTaskById(
        { ...seed, currentUserId: 'user-alice' },
        'task-1'
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('task-1');
    });

    it('memoizes on references: same inputs -> exact same Result reference', () => {
      const res1 = selectTaskById(seed, 'task-1');
      const res2 = selectTaskById(seed, 'task-1');
      expect(res1).toBe(res2);
    });
  });

  describe('selectTasksForCurrentList', () => {
    it('returns NOT_FOUND when selectedListId is null', () => {
      const res = selectTasksForCurrentList({
        ...seed,
        selectedListId: null,
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
      expect(res.error?.message).toContain('No list selected');
    });

    it('delegates to selectTasksForList when selectedListId is set', () => {
      const res = selectTasksForCurrentList({
        ...seed,
        selectedListId: 'list-1',
        currentUserId: 'user-alice',
      });
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(6);
    });

    it('memoizes on references', () => {
      const state = { ...seed, selectedListId: 'list-1' };
      const res1 = selectTasksForCurrentList(state);
      const res2 = selectTasksForCurrentList(state);
      expect(res1).toBe(res2);
    });
  });
});
