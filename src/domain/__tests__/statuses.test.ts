import { describe, it, expect } from 'vitest';
import {
  STATUS_PALETTE_TOKENS,
  STATUS_COLOR_MAP,
  getDefaultColorForCategory,
  validateStatusColor,
  validateStatusCategory,
  validateStatusName,
  planStatusDelete,
} from '@/domain/statuses';
import { Status, Task } from '@/domain/types';

describe('Domain: Statuses Engine & Migration Planner', () => {
  const dummyStatuses: Status[] = [
    {
      id: 's-todo-1',
      listId: 'list-1',
      name: 'To Do',
      category: 'todo',
      color: 'slate',
      position: 0,
    },
    {
      id: 's-prog-1',
      listId: 'list-1',
      name: 'In Progress',
      category: 'in_progress',
      color: 'blue',
      position: 1,
    },
    {
      id: 's-prog-2',
      listId: 'list-1',
      name: 'QA',
      category: 'in_progress',
      color: 'amber',
      position: 2,
    },
    {
      id: 's-done-1',
      listId: 'list-1',
      name: 'Done',
      category: 'done',
      color: 'green',
      position: 3,
    },
  ];

  describe('Colors & Palette Tokens', () => {
    it('defines all 6 fixed palette tokens and literal Tailwind mappings', () => {
      expect(STATUS_PALETTE_TOKENS).toEqual([
        'slate',
        'blue',
        'amber',
        'green',
        'red',
        'violet',
      ]);
      for (const token of STATUS_PALETTE_TOKENS) {
        const mapping = STATUS_COLOR_MAP[token];
        expect(mapping).toBeDefined();
        expect(mapping.bg).not.toContain('#');
        expect(mapping.text).not.toContain('#');
        expect(mapping.border).not.toContain('#');
        expect(mapping.dot).not.toContain('#');
      }
    });

    it('derives default color for each category', () => {
      expect(getDefaultColorForCategory('todo')).toBe('slate');
      expect(getDefaultColorForCategory('in_progress')).toBe('blue');
      expect(getDefaultColorForCategory('done')).toBe('green');
    });

    it('validates color tokens strictly', () => {
      expect(validateStatusColor('slate').success).toBe(true);
      expect(validateStatusColor('amber').success).toBe(true);
      expect(validateStatusColor('invalid-token').success).toBe(false);
      expect(validateStatusColor('#123456').success).toBe(false);
    });
  });

  describe('Category Validation', () => {
    it('accepts only todo, in_progress, done', () => {
      expect(validateStatusCategory('todo').success).toBe(true);
      expect(validateStatusCategory('in_progress').success).toBe(true);
      expect(validateStatusCategory('done').success).toBe(true);
      expect(validateStatusCategory('backlog').success).toBe(false);
    });
  });

  describe('Name Validation & Uniqueness', () => {
    it('validates trimmed 1..50 characters', () => {
      expect(validateStatusName('', dummyStatuses).success).toBe(false);
      expect(validateStatusName('   ', dummyStatuses).success).toBe(false);
      expect(validateStatusName('a'.repeat(51), dummyStatuses).success).toBe(
        false
      );
      expect(validateStatusName('  Review  ', dummyStatuses).data).toBe(
        'Review'
      );
    });

    it('enforces case-insensitive uniqueness in the same list', () => {
      const res = validateStatusName('in progress', dummyStatuses);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('already exists');
    });

    it('allows case-only rename of the same status', () => {
      // Renaming s-prog-1 from 'In Progress' to 'in progress'
      const res = validateStatusName('in progress', dummyStatuses, 's-prog-1');
      expect(res.success).toBe(true);
      expect(res.data).toBe('in progress');
    });
  });

  describe('planStatusDelete', () => {
    const baseTask: Task = {
      id: 't-1',
      primaryListId: 'list-1',
      title: 'T1',
      statusId: 's-prog-2',
      priority: 'none',
      assigneeIds: [],
      dueDate: null,
      position: 0,
      archivedAt: null,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-10T00:00:00.000Z',
    };

    it('rejects fallback status not belonging to list with INVALID_STATUS', () => {
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!, // s-prog-2
        [],
        's-nonexistent',
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_STATUS');
    });

    it('rejects fallback status of different category with VALIDATION', () => {
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!, // s-prog-2 (in_progress)
        [],
        's-todo-1', // todo
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('category');
    });

    it('rejects fallback status identical to deleted status with VALIDATION', () => {
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!,
        [],
        's-prog-2',
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('order-pair: fallback category mismatch returns VALIDATION before per-category minimum', () => {
      // s-todo-1 is the only todo status. If caller supplies fallback in_progress, it fails fallback category check first!
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[0]!, // s-todo-1 (sole todo)
        [],
        's-prog-1', // wrong category fallback
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain(
        'Fallback status must belong to category'
      );
    });

    it('enforces per-category minimum invariant when deleting sole status in category', () => {
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[0]!, // s-todo-1 (only todo status)
        [],
        undefined,
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain(
        'retain at least one status in each category'
      );
    });

    it('rejects omitted fallback when active tasks exist in status', () => {
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!, // s-prog-2
        [baseTask],
        undefined,
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain(
        'active tasks exist and no fallback'
      );
    });

    it('succeeds with omitted fallback when only soft-deleted tasks exist, remapping to first remaining same-category status', () => {
      const softDeletedTask = {
        ...baseTask,
        id: 't-soft',
        archivedAt: '2026-10-10T12:00:00.000Z',
      };
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!, // s-prog-2
        [softDeletedTask],
        undefined,
        '2026-10-11T00:00:00.000Z'
      );
      expect(res.success).toBe(true);
      expect(res.data?.fallbackStatus.id).toBe('s-prog-1');
      // Soft-deleted task remapped without bumping updatedAt or position
      const remapped = res.data?.updatedTasks['t-soft'];
      expect(remapped?.statusId).toBe('s-prog-1');
      expect(remapped?.position).toBe(softDeletedTask.position);
      expect(remapped?.updatedAt).toBe(softDeletedTask.updatedAt);
    });

    it('remaps active tasks appending to fallback column and reindexes remaining statuses', () => {
      const existingInProg1: Task = {
        ...baseTask,
        id: 't-existing',
        statusId: 's-prog-1',
        position: 0,
      };
      const activeInProg2: Task = {
        ...baseTask,
        id: 't-moving',
        statusId: 's-prog-2',
        position: 0,
      };

      const now = '2026-10-11T12:00:00.000Z';
      const res = planStatusDelete(
        dummyStatuses,
        dummyStatuses[2]!, // s-prog-2 (position 2)
        [existingInProg1, activeInProg2],
        's-prog-1',
        now
      );

      expect(res.success).toBe(true);
      // Existing task in fallback is untouched (not rewritten)
      expect(res.data?.updatedTasks['t-existing']).toBeUndefined();

      // Moving task appended to position 1, updatedAt updated
      const moved = res.data!.updatedTasks['t-moving']!;
      expect(moved.statusId).toBe('s-prog-1');
      expect(moved.position).toBe(1);
      expect(moved.updatedAt).toBe(now);

      // Remaining statuses reindexing: s-todo-1 (0) unchanged, s-prog-1 (1) unchanged, s-done-1 moved from 3 to 2
      expect(res.data?.updatedStatuses['s-todo-1']).toBeUndefined();
      expect(res.data?.updatedStatuses['s-prog-1']).toBeUndefined();
      expect(res.data?.updatedStatuses['s-done-1']?.position).toBe(2);
    });
  });
});
