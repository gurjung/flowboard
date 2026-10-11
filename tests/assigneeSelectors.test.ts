import { describe, it, expect } from 'vitest';
import { createSeedState } from '@/domain/fixtures';
import { selectAssignableUsersForList } from '@/domain/assigneeSelectors';

describe('selectAssignableUsersForList (Gate 4)', () => {
  const seed = createSeedState();

  it('returns only users who can view the given list', () => {
    // List 2: Alice (admin) and Bob (member) can view. Carol has explicit deny grant.
    const usersList2 = selectAssignableUsersForList(seed, 'list-2');
    const userIds2 = usersList2.map((u) => u.id);
    expect(userIds2).toContain('user-alice');
    expect(userIds2).toContain('user-bob');
    expect(userIds2).not.toContain('user-carol');

    // List 3 (in private folder-2 where Carol has grant): Alice (admin) and Carol can view. Bob cannot.
    const usersList3 = selectAssignableUsersForList(seed, 'list-3');
    const userIds3 = usersList3.map((u) => u.id);
    expect(userIds3).toContain('user-alice');
    expect(userIds3).toContain('user-carol');
    expect(userIds3).not.toContain('user-bob');
  });

  it('returns empty array for non-existent list', () => {
    const users = selectAssignableUsersForList(seed, 'list-nonexistent');
    expect(users).toEqual([]);
  });
});
