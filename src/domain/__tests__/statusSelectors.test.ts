import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectStatusesForList,
  selectStatusById,
} from '@/domain/statusSelectors';
import { createSeedState } from '@/domain/fixtures';

describe('Domain: Status Selectors Engine', () => {
  let seed = createSeedState();

  beforeEach(() => {
    seed = createSeedState();
  });

  describe('selectStatusesForList', () => {
    it('returns NOT_FOUND for a nonexistent list', () => {
      const res = selectStatusesForList(seed, 'nonexistent-list');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns FORBIDDEN when user cannot view list (Bob on private list-3)', () => {
      const res = selectStatusesForList(
        { ...seed, currentUserId: 'user-bob' },
        'list-3'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
    });

    it('returns VALIDATION when target container is not a list', () => {
      const res = selectStatusesForList(
        { ...seed, currentUserId: 'user-alice' },
        'folder-1'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('returns CONFLICT when list is archived', () => {
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
      const res = selectStatusesForList(
        { ...archivedSeed, currentUserId: 'user-alice' },
        'list-1'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CONFLICT');
    });

    it('returns ok(Status[]) sorted by position ascending', () => {
      const res = selectStatusesForList(
        { ...seed, currentUserId: 'user-alice' },
        'list-1'
      );
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(4);
      // Contiguous 0..3
      res.data?.forEach((s, idx) => expect(s.position).toBe(idx));
      expect(res.data?.map((s) => s.id)).toEqual([
        'status-1-todo',
        'status-1-prog',
        'status-1-qa',
        'status-1-done',
      ]);
    });

    it('memoizes on references', () => {
      const res1 = selectStatusesForList(seed, 'list-1');
      const res2 = selectStatusesForList(seed, 'list-1');
      expect(res1).toBe(res2);
    });
  });

  describe('selectStatusById', () => {
    it('returns NOT_FOUND for a nonexistent status', () => {
      const res = selectStatusById(seed, 'nonexistent-status');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('returns FORBIDDEN without leaking status name when user cannot view list (Bob on list-3 status)', () => {
      const res = selectStatusById(
        { ...seed, currentUserId: 'user-bob' },
        'status-3-todo'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
      expect(res.error?.message).not.toContain('To Do');
      expect(res.data).toBeUndefined();
    });

    it('returns CONFLICT when parent list is archived', () => {
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
      const res = selectStatusById(
        { ...archivedSeed, currentUserId: 'user-alice' },
        'status-1-todo'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CONFLICT');
    });

    it('returns ok(status) when accessible', () => {
      const res = selectStatusById(
        { ...seed, currentUserId: 'user-alice' },
        'status-1-qa'
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe('status-1-qa');
      expect(res.data?.name).toBe('QA');
      expect(res.data?.color).toBe('amber');
    });

    it('memoizes on references', () => {
      const res1 = selectStatusById(seed, 'status-1-qa');
      const res2 = selectStatusById(seed, 'status-1-qa');
      expect(res1).toBe(res2);
    });
  });
});
