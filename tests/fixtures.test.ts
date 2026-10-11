import { describe, it, expect } from 'vitest';
import { createSeedState } from '@/domain/fixtures';
import { canViewNode } from '@/domain/permissions';

describe('Seed Fixtures Integrity', () => {
  it('creates fresh independent state instances on every call', () => {
    const stateA = createSeedState();
    const stateB = createSeedState();

    expect(stateA).not.toBe(stateB);
    const taskA = stateA.tasks['task-1'];
    expect(taskA).toBeDefined();
    if (taskA) {
      taskA.title = 'Mutated Title';
    }

    expect(stateB.tasks['task-1']?.title).toBe(
      'Implement token refresh rotation flow'
    );
  });

  it('satisfies required entity counts', () => {
    const state = createSeedState();

    expect(Object.keys(state.workspaces).length).toBe(1);
    expect(Object.keys(state.spaces).length).toBe(2);
    expect(Object.keys(state.folders).length).toBe(2);
    expect(Object.keys(state.lists).length).toBe(3);
    expect(Object.keys(state.users).length).toBe(3);
    expect(Object.keys(state.tasks).length).toBe(16);
    expect(Object.keys(state.tasks).length).toBeGreaterThanOrEqual(15);
    expect(Object.keys(state.statuses).length).toBe(9);
  });

  it('guarantees unique IDs across all domain entities', () => {
    const state = createSeedState();
    const allIds = [
      ...Object.keys(state.workspaces),
      ...Object.keys(state.spaces),
      ...Object.keys(state.folders),
      ...Object.keys(state.lists),
      ...Object.keys(state.statuses),
      ...Object.keys(state.tasks),
      ...Object.keys(state.users),
      ...Object.keys(state.grants),
    ];

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('enforces contiguous 0-indexed positions for container siblings', () => {
    const state = createSeedState();

    // Spaces under ws-1
    const spaces = Object.values(state.spaces).sort(
      (a, b) => a.position - b.position
    );
    expect(spaces.map((s) => s.position)).toEqual([0, 1]);

    // Folders under space-1
    const foldersSpace1 = Object.values(state.folders)
      .filter((f) => f.parentId === 'space-1')
      .sort((a, b) => a.position - b.position);
    expect(foldersSpace1.map((f) => f.position)).toEqual([0, 1]);

    // Lists under folder-1
    const listsFolder1 = Object.values(state.lists)
      .filter((l) => l.parentId === 'folder-1')
      .sort((a, b) => a.position - b.position);
    expect(listsFolder1.map((l) => l.position)).toEqual([0, 1]);

    // Lists under folder-2
    const listsFolder2 = Object.values(state.lists)
      .filter((l) => l.parentId === 'folder-2')
      .sort((a, b) => a.position - b.position);
    expect(listsFolder2.map((l) => l.position)).toEqual([0]);
  });

  it('enforces contiguous 0-indexed positions within each status column', () => {
    const state = createSeedState();

    // Group tasks by list and status
    const tasks = Object.values(state.tasks);
    const statusGroups: Record<string, number[]> = {};

    for (const task of tasks) {
      if (!statusGroups[task.statusId]) {
        statusGroups[task.statusId] = [];
      }
      statusGroups[task.statusId]?.push(task.position);
    }

    for (const [, positions] of Object.entries(statusGroups)) {
      positions.sort((a, b) => a - b);
      const expected = positions.map((_, idx) => idx);
      expect(positions).toEqual(expected);
    }
  });

  it('enforces valid container hierarchy: Workspace -> Space -> Folder -> List', () => {
    const state = createSeedState();

    // Workspace has null parent
    for (const ws of Object.values(state.workspaces)) {
      expect(ws.parentId).toBeNull();
      expect(ws.type).toBe('workspace');
    }

    // Spaces belong to workspace
    for (const space of Object.values(state.spaces)) {
      expect(space.type).toBe('space');
      expect(state.workspaces[space.parentId]).toBeDefined();
    }

    // Folders belong to spaces
    for (const folder of Object.values(state.folders)) {
      expect(folder.type).toBe('folder');
      expect(state.spaces[folder.parentId]).toBeDefined();
    }

    // Lists belong to folders
    for (const list of Object.values(state.lists)) {
      expect(list.type).toBe('list');
      expect(state.folders[list.parentId]).toBeDefined();
    }
  });

  it('validates task consistency: status belongs to primaryListId, assignees exist, title valid', () => {
    const state = createSeedState();

    for (const task of Object.values(state.tasks)) {
      // Primary list must exist
      const list = state.lists[task.primaryListId];
      expect(list).toBeDefined();

      // Status must exist and belong to the primary list
      const status = state.statuses[task.statusId];
      expect(status).toBeDefined();
      expect(status?.listId).toBe(task.primaryListId);
      expect(list?.statusIds).toContain(task.statusId);

      // Title within 500 chars and non-empty
      expect(task.title.length).toBeGreaterThan(0);
      expect(task.title.length).toBeLessThanOrEqual(500);

      // Assignees must be valid user IDs
      for (const userId of task.assigneeIds) {
        expect(state.users[userId]).toBeDefined();
      }
    }
  });

  it('guarantees Alice, Bob, and Carol have distinct accessible list sets per D-011', () => {
    const state = createSeedState();

    // Alice: admin sees all 3 lists
    // Bob: sees list-1 and list-2, cannot see list-3 (folder-2 is private with no grant)
    // Carol: sees list-1 and list-3 (grant-1 gives allow on folder-2; grant-2 gives explicit deny on list-2)

    // Helper visibility simulation strictly matching D-011 rules
    function isListVisible(listId: string, userId: string): boolean {
      const user = state.users[userId];
      if (!user) return false;
      if (user.role === 'admin') return true;

      const list = state.lists[listId];
      if (!list) return false;

      const folder = state.folders[list.parentId];
      if (!folder) return false;

      const space = state.spaces[folder.parentId];
      if (!space) return false;

      // Check grants on container chain (list, folder, space)
      const grants = Object.values(state.grants).filter(
        (g) => g.userId === userId
      );

      // Deny on list or any ancestor blocks visibility
      const hasDeny = grants.some(
        (g) =>
          g.mode === 'deny' &&
          (g.resourceId === list.id ||
            g.resourceId === folder.id ||
            g.resourceId === space.id)
      );
      if (hasDeny) return false;

      // If folder or space is private, requires explicit allow on that container or list
      if (folder.visibility === 'private') {
        const hasAllow = grants.some(
          (g) =>
            g.mode === 'allow' &&
            (g.resourceId === folder.id || g.resourceId === list.id)
        );
        if (!hasAllow) return false;
      }

      return true;
    }

    const allListIds = ['list-1', 'list-2', 'list-3'];

    const aliceLists = allListIds.filter((id) =>
      isListVisible(id, 'user-alice')
    );
    const bobLists = allListIds.filter((id) => isListVisible(id, 'user-bob'));
    const carolLists = allListIds.filter((id) =>
      isListVisible(id, 'user-carol')
    );

    // Alice sees all lists
    expect(aliceLists).toEqual(['list-1', 'list-2', 'list-3']);

    // Bob sees Lists 1 and 2 (blocked from List 3 under private Folder 2)
    expect(bobLists).toEqual(['list-1', 'list-2']);

    // Carol sees Lists 1 and 3 (explicit deny on List 2, allow on private Folder 2)
    expect(carolLists).toEqual(['list-1', 'list-3']);

    // All three visibility sets are distinct
    expect(
      new Set([aliceLists.join(), bobLists.join(), carolLists.join()]).size
    ).toBe(3);
  });

  it('guarantees per-status-column contiguous 0-indexed positions for active tasks', () => {
    const state = createSeedState();
    const tasksByColumn = new Map<string, (typeof state.tasks)[string][]>();

    for (const task of Object.values(state.tasks)) {
      if (task.archivedAt !== null) continue;
      const key = `${task.primaryListId}:${task.statusId}`;
      const existing = tasksByColumn.get(key) ?? [];
      existing.push(task);
      tasksByColumn.set(key, existing);
    }

    for (const [, columnTasks] of tasksByColumn.entries()) {
      columnTasks.sort((a, b) => a.position - b.position);
      for (let i = 0; i < columnTasks.length; i++) {
        expect(columnTasks[i]?.position).toBe(i);
      }
    }
  });

  it('guarantees every assignee on seed data can view their task list', () => {
    const state = createSeedState();
    const allNodes = {
      ...state.workspaces,
      ...state.spaces,
      ...state.folders,
      ...state.lists,
    };
    const grants = Object.values(state.grants);

    // Verify each task's assignees can view the task's list
    for (const task of Object.values(state.tasks)) {
      const list = state.lists[task.primaryListId];
      expect(list).toBeDefined();

      for (const userId of task.assigneeIds) {
        const user = state.users[userId];
        expect(user).toBeDefined();

        const accessible = canViewNode(user, task.primaryListId, {
          nodes: allNodes,
          grants,
        });
        expect(accessible).toBe(true);
      }
    }
  });
});
