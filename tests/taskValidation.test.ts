import { describe, it, expect } from 'vitest';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateTaskPriority,
  validateTaskDueDate,
  validateTaskAssignees,
  validatePatchKeys,
} from '@/domain/taskValidation';
import { createSeedState } from '@/domain/fixtures';

describe('Domain: Task Validation Engine', () => {
  const seed = createSeedState();
  const allNodes = {
    ...seed.workspaces,
    ...seed.spaces,
    ...seed.folders,
    ...seed.lists,
  };
  const permState = {
    nodes: allNodes,
    grants: Object.values(seed.grants),
  };

  describe('validateTaskTitle', () => {
    it('rejects non-string titles', () => {
      const res = validateTaskTitle(123);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('rejects empty or whitespace-only titles', () => {
      expect(validateTaskTitle('').success).toBe(false);
      expect(validateTaskTitle('   ').success).toBe(false);
    });

    it('rejects titles longer than 500 characters', () => {
      const longTitle = 'a'.repeat(501);
      const res = validateTaskTitle(longTitle);
      expect(res.success).toBe(false);
      expect(res.error?.message).toContain('500 characters');
    });

    it('accepts valid trimmed titles', () => {
      const res = validateTaskTitle('  Fix authentication bug  ');
      expect(res.success).toBe(true);
      expect(res.data).toBe('Fix authentication bug');
    });
  });

  describe('validateTaskDescription', () => {
    it('accepts null and undefined', () => {
      expect(validateTaskDescription(undefined).data).toBeUndefined();
      expect(validateTaskDescription(null).data).toBeUndefined();
    });

    it('rejects non-strings', () => {
      expect(validateTaskDescription(123).success).toBe(false);
    });

    it('rejects descriptions over 5000 characters', () => {
      const longDesc = 'x'.repeat(5001);
      const res = validateTaskDescription(longDesc);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('accepts valid descriptions', () => {
      const res = validateTaskDescription('A detailed task note');
      expect(res.success).toBe(true);
      expect(res.data).toBe('A detailed task note');
    });
  });

  describe('validateTaskPriority', () => {
    it('accepts valid priority values', () => {
      for (const p of ['urgent', 'high', 'normal', 'low', 'none']) {
        const res = validateTaskPriority(p);
        expect(res.success).toBe(true);
        expect(res.data).toBe(p);
      }
    });

    it('rejects invalid or legacy priorities like medium', () => {
      const res = validateTaskPriority('medium');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });
  });

  describe('validateTaskDueDate', () => {
    it('accepts null (clears due date)', () => {
      const res = validateTaskDueDate(null);
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('rejects non-string values', () => {
      expect(validateTaskDueDate(123).success).toBe(false);
      expect(validateTaskDueDate({}).success).toBe(false);
      expect(validateTaskDueDate(undefined).success).toBe(false);
    });

    it('accepts seed ISO-8601 UTC timestamp format', () => {
      const res = validateTaskDueDate('2026-10-15T18:00:00.000Z');
      expect(res.success).toBe(true);
      expect(res.data).toBe('2026-10-15T18:00:00.000Z');
    });

    it('rejects 2026-02-30 (impossible February date)', () => {
      const res = validateTaskDueDate('2026-02-30T12:00:00.000Z');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('rejects T24:00:00.000Z (hour 24 is out of bounds for ISO time)', () => {
      const res = validateTaskDueDate('2026-10-11T24:00:00.000Z');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('rejects 2027-02-29 (non-leap year)', () => {
      const res = validateTaskDueDate('2027-02-29T12:00:00.000Z');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('accepts 2028-02-29 (leap year)', () => {
      const res = validateTaskDueDate('2028-02-29T12:00:00.000Z');
      expect(res.success).toBe(true);
      expect(res.data).toBe('2028-02-29T12:00:00.000Z');
    });

    it('rejects missing milliseconds and timezone offsets like +05:30', () => {
      expect(validateTaskDueDate('2026-10-15T18:00:00Z').success).toBe(false);
      expect(validateTaskDueDate('2026-10-15T18:00:00.000+05:30').success).toBe(
        false
      );
      expect(validateTaskDueDate('2026-10-15').success).toBe(false);
      expect(validateTaskDueDate('invalid-date').success).toBe(false);
    });
  });

  describe('validateTaskAssignees', () => {
    it('deduplicates assignees preserving first-occurrence order', () => {
      const res = validateTaskAssignees(
        ['user-bob', 'user-alice', 'user-bob'],
        seed.users,
        'list-1',
        permState
      );
      expect(res.success).toBe(true);
      expect(res.data).toEqual(['user-bob', 'user-alice']);
    });

    it('fails if an assignee does not exist in users', () => {
      const res = validateTaskAssignees(
        ['nonexistent-user'],
        seed.users,
        'list-1',
        permState
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('fails if an assignee cannot view the target list (e.g. Bob on private list-3)', () => {
      // Bob has no grant on folder-2 / list-3
      const res = validateTaskAssignees(
        ['user-bob'],
        seed.users,
        'list-3',
        permState
      );
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('Bob Member');
    });

    it('succeeds for Carol on list-3 (who has allow grant on parent folder-2)', () => {
      const res = validateTaskAssignees(
        ['user-carol'],
        seed.users,
        'list-3',
        permState
      );
      expect(res.success).toBe(true);
      expect(res.data).toEqual(['user-carol']);
    });
  });

  describe('validatePatchKeys', () => {
    it('allows valid patch keys', () => {
      const res = validatePatchKeys({
        title: 'New title',
        priority: 'high',
        dueDate: null,
      });
      expect(res.success).toBe(true);
    });

    it('rejects unknown or immutable keys like primaryListId or position', () => {
      expect(validatePatchKeys({ primaryListId: 'list-2' }).success).toBe(
        false
      );
      expect(validatePatchKeys({ position: 5 }).success).toBe(false);
      expect(validatePatchKeys({ id: 'task-1' }).success).toBe(false);
      expect(validatePatchKeys({ foo: 'bar' }).success).toBe(false);
    });

    it('rejects patch keys with undefined values', () => {
      const res = validatePatchKeys({ title: undefined });
      expect(res.success).toBe(false);
      expect(res.error?.message).toContain('undefined');
    });
  });
});
