import { describe, it, expect, beforeEach } from 'vitest';
import { createFlowboardStore } from '@/store/createFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { selectTaskById, selectTasksForList } from '@/domain/taskSelectors';
import { UpdateTaskPatch } from '@/store/types';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('Store: Task Operations Engine & Guards', () => {
  let store: ReturnType<typeof createFlowboardStore>;

  beforeEach(() => {
    store = createFlowboardStore(createSeedState(), { latencyMs: 0 });
  });

  describe('D-033: Guard Precedence, Probing & Pre-Validation Order', () => {
    it('member on a nonexistent id returns NOT_FOUND', () => {
      store.getState().setCurrentUser('user-bob');
      const res = store
        .getState()
        .updateTaskSync('nonexistent-id', { title: 'New' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('Bob touches a deleted list-3 task and returns FORBIDDEN (read-style permission before delete)', () => {
      // First archive task-12 under Alice (Admin)
      store.getState().setCurrentUser('user-alice');
      store.getState().deleteTaskSync('task-12');

      // Now switch to Bob (who is forbidden on list-3)
      store.getState().setCurrentUser('user-bob');

      // Update attempt
      const updateRes = store
        .getState()
        .updateTaskSync('task-12', { title: 'Probe' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error?.code).toBe('FORBIDDEN');

      // Delete attempt
      const deleteRes = store.getState().deleteTaskSync('task-12');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error?.code).toBe('FORBIDDEN');
    });

    it('corrupt parent chain returns FORBIDDEN for create, update, changeStatus, move, and delete', () => {
      const corruptedSeed = createSeedState();
      corruptedSeed.folders['folder-1']!.parentId = 'nonexistent-parent';

      const corruptStore = createFlowboardStore(corruptedSeed);
      corruptStore.getState().setCurrentUser('user-alice');

      // create
      const createRes = corruptStore.getState().createTaskSync({
        listId: 'list-1',
        title: 'New in corrupt hierarchy',
      });
      expect(createRes.success).toBe(false);
      expect(createRes.error?.code).toBe('FORBIDDEN');

      // update
      const updateRes = corruptStore
        .getState()
        .updateTaskSync('task-1', { title: 'Updated' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error?.code).toBe('FORBIDDEN');

      // changeStatus
      const statusRes = corruptStore
        .getState()
        .changeTaskStatusSync('task-1', 'status-1-prog');
      expect(statusRes.success).toBe(false);
      expect(statusRes.error?.code).toBe('FORBIDDEN');

      // move
      const moveRes = corruptStore
        .getState()
        .moveTaskToListSync('task-1', 'list-2');
      expect(moveRes.success).toBe(false);
      expect(moveRes.error?.code).toBe('FORBIDDEN');

      // delete
      const deleteRes = corruptStore.getState().deleteTaskSync('task-1');
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error?.code).toBe('FORBIDDEN');
    });

    it('cyclic parent chain returns FORBIDDEN for create, update, changeStatus, move, and delete', () => {
      const cyclicSeed = createSeedState();
      // Introduce cycle between folder-1 and folder-2
      cyclicSeed.folders['folder-1']!.parentId = 'folder-2';
      cyclicSeed.folders['folder-2']!.parentId = 'folder-1';

      const cyclicStore = createFlowboardStore(cyclicSeed);
      cyclicStore.getState().setCurrentUser('user-alice');

      expect(
        cyclicStore.getState().createTaskSync({ listId: 'list-1', title: 'A' })
          .error?.code
      ).toBe('FORBIDDEN');
      expect(
        cyclicStore.getState().updateTaskSync('task-1', { title: 'B' }).error
          ?.code
      ).toBe('FORBIDDEN');
      expect(
        cyclicStore.getState().changeTaskStatusSync('task-1', 'status-1-prog')
          .error?.code
      ).toBe('FORBIDDEN');
      expect(
        cyclicStore.getState().moveTaskToListSync('task-1', 'list-2').error
          ?.code
      ).toBe('FORBIDDEN');
      expect(cyclicStore.getState().deleteTaskSync('task-1').error?.code).toBe(
        'FORBIDDEN'
      );
    });

    it('guard order pair tests: validation runs before CONFLICT in an archived list', () => {
      // Archive list-1
      store.getState().archiveContainerSync('list-1');

      // 1. updateTask: invalid title returns VALIDATION, valid title returns CONFLICT
      const invalidUpdate = store
        .getState()
        .updateTaskSync('task-1', { title: '' });
      expect(invalidUpdate.success).toBe(false);
      expect(invalidUpdate.error?.code).toBe('VALIDATION');

      const validUpdate = store
        .getState()
        .updateTaskSync('task-1', { title: 'Valid Title' });
      expect(validUpdate.success).toBe(false);
      expect(validUpdate.error?.code).toBe('CONFLICT');

      // 2. changeTaskStatus: invalid index returns VALIDATION, invalid statusId returns INVALID_STATUS, valid returns CONFLICT
      const invalidIdxStatus = store
        .getState()
        .changeTaskStatusSync('task-1', 'status-1-prog', -1);
      expect(invalidIdxStatus.success).toBe(false);
      expect(invalidIdxStatus.error?.code).toBe('VALIDATION');

      const invalidStatusId = store
        .getState()
        .changeTaskStatusSync('task-1', 'status-2-todo');
      expect(invalidStatusId.success).toBe(false);
      expect(invalidStatusId.error?.code).toBe('INVALID_STATUS');

      const validStatusMove = store
        .getState()
        .changeTaskStatusSync('task-1', 'status-1-prog', 0);
      expect(validStatusMove.success).toBe(false);
      expect(validStatusMove.error?.code).toBe('CONFLICT');
    });

    it.each([
      {
        name: 'createTaskSync (invalid title)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().createTaskSync({ listId: 'list-1', title: '' }),
        expectedCode: 'VALIDATION',
      },
      {
        name: 'updateTaskSync (nonexistent task)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().updateTaskSync('nonexistent-id', { title: 'New' }),
        expectedCode: 'NOT_FOUND',
      },
      {
        name: 'changeTaskStatusSync (out-of-range index)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().changeTaskStatusSync('task-1', 'status-1-todo', 99),
        expectedCode: 'VALIDATION',
      },
      {
        name: 'reorderTaskSync (out-of-range index)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().reorderTaskSync('task-1', 99),
        expectedCode: 'VALIDATION',
      },
      {
        name: 'moveTaskToListSync (unauthorized assignee)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().moveTaskToListSync('task-2', 'list-3'),
        expectedCode: 'VALIDATION',
      },
      {
        name: 'deleteTaskSync (nonexistent task)',
        act: (s: ReturnType<typeof createFlowboardStore>) =>
          s.getState().deleteTaskSync('nonexistent-id'),
        expectedCode: 'NOT_FOUND',
      },
    ])(
      'failed mutation leaves whole state reference-equal: $name',
      ({ act, expectedCode }) => {
        const stateBefore = store.getState();
        const res = act(store);
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe(expectedCode);
        expect(store.getState()).toBe(stateBefore);
      }
    );

    it('deep-frozen state is never mutated across any action', () => {
      const frozenSeed = deepFreeze(createSeedState());
      const frozenStore = createFlowboardStore(frozenSeed, { latencyMs: 0 });

      // create
      const createRes = frozenStore
        .getState()
        .createTaskSync({ listId: 'list-1', title: 'Created Task' });
      expect(createRes.success).toBe(true);

      // update
      const updateRes = frozenStore
        .getState()
        .updateTaskSync('task-1', { title: 'Updated Valid Title' });
      expect(updateRes.success).toBe(true);

      // changeTaskStatus
      const statusRes = frozenStore
        .getState()
        .changeTaskStatusSync('task-1', 'status-1-prog', 0);
      expect(statusRes.success).toBe(true);

      // reorderTask
      const reorderRes = frozenStore.getState().reorderTaskSync('task-2', 0);
      expect(reorderRes.success).toBe(true);

      // moveTaskToList
      const moveRes = frozenStore
        .getState()
        .moveTaskToListSync('task-1', 'list-2');
      expect(moveRes.success).toBe(true);

      // deleteTask
      const deleteRes = frozenStore.getState().deleteTaskSync('task-3');
      expect(deleteRes.success).toBe(true);
    });

    it('two stores remain completely isolated', () => {
      const storeA = createFlowboardStore(createSeedState());
      const storeB = createFlowboardStore(createSeedState());

      storeA.getState().deleteTaskSync('task-1');
      expect(storeA.getState().tasks['task-1']?.archivedAt).not.toBeNull();
      expect(storeB.getState().tasks['task-1']?.archivedAt).toBeNull();
    });

    it('an async action without await changes state synchronously before first delay', () => {
      const slowStore = createFlowboardStore(createSeedState(), {
        latencyMs: 500,
      });
      // Call async without awaiting
      void slowStore.getState().deleteTask('task-1');

      // Mutation has already taken effect synchronously!
      expect(slowStore.getState().tasks['task-1']?.archivedAt).not.toBeNull();
    });
  });

  describe('createTask: Field Defaults, Positioning & Validation', () => {
    it('creates task with default todo status, appended position, trimmed title, and deps.now timestamps', () => {
      const customNow = '2026-10-11T12:34:56.789Z';
      const customStore = createFlowboardStore(createSeedState(), {
        now: () => customNow,
        newId: () => 'task-custom-id',
      });

      // Active tasks in list-1 status-1-todo is 3 (task-1, task-2, task-6)
      const res = customStore.getState().createTaskSync({
        listId: 'list-1',
        title: '   Trimmed New Task Title   ',
      });

      expect(res.success).toBe(true);
      const created = res.data!;
      expect(created.id).toBe('task-custom-id');
      expect(created.title).toBe('Trimmed New Task Title');
      expect(created.statusId).toBe('status-1-todo');
      expect(created.position).toBe(3); // appended at end of 3 active tasks
      expect(created.priority).toBe('none');
      expect(created.createdAt).toBe(customNow);
      expect(created.updatedAt).toBe(customNow);
      expect(created.archivedAt).toBeNull();
    });

    it('rejects invalid title and invalid priority with VALIDATION', () => {
      const titleRes = store
        .getState()
        .createTaskSync({ listId: 'list-1', title: '' });
      expect(titleRes.success).toBe(false);
      expect(titleRes.error?.code).toBe('VALIDATION');

      const prioRes = store.getState().createTaskSync({
        listId: 'list-1',
        title: 'Valid',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        priority: 'invalid-prio' as any,
      });
      expect(prioRes.success).toBe(false);
      expect(prioRes.error?.code).toBe('VALIDATION');
    });

    it('returns INVALID_PARENT when target container is a folder', () => {
      const res = store
        .getState()
        .createTaskSync({ listId: 'folder-1', title: 'Task in Folder' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_PARENT');
    });

    it('returns CONFLICT when target list is archived', () => {
      store.getState().archiveContainerSync('list-1');
      const res = store
        .getState()
        .createTaskSync({ listId: 'list-1', title: 'In Archived List' });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CONFLICT');
    });

    it('returns VALIDATION when assignee cannot view target list', () => {
      // Bob cannot view list-3
      const res = store.getState().createTaskSync({
        listId: 'list-3',
        title: 'Task for Bob',
        assigneeIds: ['user-bob'],
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('Bob Member');
    });
  });

  describe('D-034 & D-040: moveTaskToList & Assignee Access', () => {
    it('Alice moves a list-1 task assigned to Bob into list-3 -> VALIDATION (state unchanged)', () => {
      store.getState().setCurrentUser('user-alice');
      // task-2 is in list-1, assigned to Bob. List-3 is private without Bob grant.
      const stateBefore = store.getState();
      expect(stateBefore.tasks['task-2']?.assigneeIds).toContain('user-bob');

      const res = store.getState().moveTaskToListSync('task-2', 'list-3');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('Bob Member');

      // Entire state reference must be unchanged!
      expect(store.getState()).toBe(stateBefore);
    });

    it('same-list move is a no-op success only after all guards pass; in an archived list it is CONFLICT', () => {
      // Active list: no-op success with unchanged state reference
      const stateBefore = store.getState();
      const res = store.getState().moveTaskToListSync('task-1', 'list-1');
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);

      // Archive list-1
      store.getState().archiveContainerSync('list-1');
      const conflictRes = store
        .getState()
        .moveTaskToListSync('task-1', 'list-1');
      expect(conflictRes.success).toBe(false);
      expect(conflictRes.error?.code).toBe('CONFLICT');
    });

    it('successful moveTaskToList maps status by category and keeps both columns contiguous', () => {
      store.getState().updateTaskSync('task-1', { assigneeIds: [] });

      const origDestTasks = Object.values(store.getState().tasks).filter(
        (t) =>
          t.primaryListId === 'list-3' &&
          t.statusId === 'status-3-todo' &&
          t.archivedAt === null
      );
      const origDestCount = origDestTasks.length;

      const origDestTask1UpdatedAt =
        origDestCount > 0 ? origDestTasks[0]?.updatedAt : undefined;

      const res = store.getState().moveTaskToListSync('task-1', 'list-3');
      expect(res.success).toBe(true);
      expect(res.data?.primaryListId).toBe('list-3');
      expect(res.data?.statusId).toBe('status-3-todo');

      // Both source and destination columns remain contiguous
      const sourceActive = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-1' &&
            t.statusId === 'status-1-todo' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      expect(sourceActive.length).toBe(2); // 3 down to 2
      sourceActive.forEach((t, idx) => expect(t.position).toBe(idx));

      const destActive = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-3' &&
            t.statusId === 'status-3-todo' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      expect(destActive.length).toBe(origDestCount + 1);
      destActive.forEach((t, idx) => expect(t.position).toBe(idx));

      // updatedAt is bumped ONLY on the moved task; destination siblings remain untouched
      if (origDestCount > 0 && origDestTask1UpdatedAt) {
        expect(store.getState().tasks[origDestTasks[0]!.id]?.updatedAt).toBe(
          origDestTask1UpdatedAt
        );
      }
    });

    it('moveTaskToList validates non-list destination, nonexistent destination, and permissions', () => {
      // Non-list destination (folder-1) -> INVALID_PARENT
      const nonListRes = store
        .getState()
        .moveTaskToListSync('task-1', 'folder-1');
      expect(nonListRes.success).toBe(false);
      expect(nonListRes.error?.code).toBe('INVALID_PARENT');

      // Nonexistent destination -> NOT_FOUND
      const nonExistentRes = store
        .getState()
        .moveTaskToListSync('task-1', 'nonexistent-list');
      expect(nonExistentRes.success).toBe(false);
      expect(nonExistentRes.error?.code).toBe('NOT_FOUND');

      // Bob tries to move list-2 task into private list-3 (where Bob has no permission) -> FORBIDDEN
      store.getState().setCurrentUser('user-bob');
      const forbiddenRes = store
        .getState()
        .moveTaskToListSync('task-7', 'list-3');
      expect(forbiddenRes.success).toBe(false);
      expect(forbiddenRes.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('D-036 & D-037: Reordering & Column Position Invariant', () => {
    it('rejects non-integer and out-of-range index across columns and same column', () => {
      // In list-1 status-1-prog, active tasks: 2 (task-3, task-4).
      // Cross-column allowed target range: 0..2.
      expect(
        store.getState().changeTaskStatusSync('task-1', 'status-1-prog', NaN)
          .error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().changeTaskStatusSync('task-1', 'status-1-prog', 1.5)
          .error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().changeTaskStatusSync('task-1', 'status-1-prog', -1)
          .error?.code
      ).toBe('VALIDATION');
      expect(
        store
          .getState()
          .changeTaskStatusSync('task-1', 'status-1-prog', Infinity).error?.code
      ).toBe('VALIDATION');
      // K + 1 = 3 (out of bounds)
      expect(
        store.getState().changeTaskStatusSync('task-1', 'status-1-prog', 3)
          .error?.code
      ).toBe('VALIDATION');

      // K = 2 is valid append position into status-1-prog!
      expect(
        store.getState().changeTaskStatusSync('task-1', 'status-1-prog', 2)
          .success
      ).toBe(true);

      // Same-column index validation: status-1-todo now has 2 tasks (task-5, task-6).
      // Allowed range is 0..1.
      expect(store.getState().reorderTaskSync('task-5', NaN).error?.code).toBe(
        'VALIDATION'
      );
      expect(store.getState().reorderTaskSync('task-5', 1.5).error?.code).toBe(
        'VALIDATION'
      );
      expect(store.getState().reorderTaskSync('task-5', -1).error?.code).toBe(
        'VALIDATION'
      );
      expect(
        store.getState().reorderTaskSync('task-5', Infinity).error?.code
      ).toBe('VALIDATION');
      // K = 2 is out of bounds for same column with 2 tasks
      expect(store.getState().reorderTaskSync('task-5', 2).error?.code).toBe(
        'VALIDATION'
      );
    });

    it('cross-column changeTaskStatus keeps BOTH columns contiguous 0..K-1', () => {
      // Initial: status-1-todo has 3 tasks (task-1, task-5, task-6). status-1-prog has 2 tasks (task-2, task-3).
      const res = store
        .getState()
        .changeTaskStatusSync('task-1', 'status-1-prog', 1);
      expect(res.success).toBe(true);

      const sourceActive = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-1' &&
            t.statusId === 'status-1-todo' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      expect(sourceActive.length).toBe(2);
      sourceActive.forEach((t, idx) => expect(t.position).toBe(idx));

      const destActive = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-1' &&
            t.statusId === 'status-1-prog' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      expect(destActive.length).toBe(3);
      destActive.forEach((t, idx) => expect(t.position).toBe(idx));
    });

    it('reorderTask with the same index = no-op success with unchanged state reference', () => {
      const stateBefore = store.getState();
      const task = stateBefore.tasks['task-1']!;
      const res = store.getState().reorderTaskSync('task-1', task.position);
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });

    it('reorder updates position and bumps updatedAt ONLY on directly-acted task; siblings updatedAt untouched', () => {
      const origT1UpdatedAt = store.getState().tasks['task-1']!.updatedAt;
      const origT2UpdatedAt = store.getState().tasks['task-2']!.updatedAt;

      // Reorder task-1 to index 1 (swapping with task-2)
      const res = store.getState().reorderTaskSync('task-1', 1);
      expect(res.success).toBe(true);

      const afterT1 = store.getState().tasks['task-1']!;
      const afterT2 = store.getState().tasks['task-2']!;

      expect(afterT1.position).toBe(1);
      expect(afterT2.position).toBe(0);

      // Directly-acted task updatedAt is updated
      expect(afterT1.updatedAt).not.toBe(origT1UpdatedAt);
      // Siblings' updatedAt is strictly untouched!
      expect(afterT2.updatedAt).toBe(origT2UpdatedAt);
    });
  });

  describe('D-037 & D-038: updateTask Field Validation & Whitelist', () => {
    it('rejects unknown or immutable keys with VALIDATION', () => {
      const res = store.getState().updateTaskSync('task-1', {
        primaryListId: 'list-2',
      } as unknown as UpdateTaskPatch);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
    });

    it('empty patch = no-op success with unchanged state reference', () => {
      const stateBefore = store.getState();
      const res = store.getState().updateTaskSync('task-1', {});
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });

    it('no-op patch with identical values = no-op success with unchanged state reference', () => {
      const stateBefore = store.getState();
      const task = stateBefore.tasks['task-1']!;
      const res = store.getState().updateTaskSync('task-1', {
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeIds: [...task.assigneeIds],
      });
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });
  });

  describe('D-039: Soft Deletion & NOT_FOUND Read Boundary', () => {
    it('Bob deletes a list-2 task then reads it by id -> NOT_FOUND', () => {
      store.getState().setCurrentUser('user-bob');
      // list-2 task is task-7
      const delRes = store.getState().deleteTaskSync('task-7');
      expect(delRes.success).toBe(true);

      // Reading by id returns NOT_FOUND
      const readRes = selectTaskById(store.getState(), 'task-7');
      expect(readRes.success).toBe(false);
      expect(readRes.error?.code).toBe('NOT_FOUND');

      // Deleted task is excluded from list
      const listRes = selectTasksForList(store.getState(), 'list-2');
      expect(listRes.success).toBe(true);
      expect(listRes.data?.some((t) => t.id === 'task-7')).toBe(false);
    });

    it('double delete returns NOT_FOUND', () => {
      store.getState().deleteTaskSync('task-1');
      const secondDel = store.getState().deleteTaskSync('task-1');
      expect(secondDel.success).toBe(false);
      expect(secondDel.error?.code).toBe('NOT_FOUND');
    });

    it('deleteTask reindexes remaining tasks in column to contiguous 0..K-1', () => {
      // In list-1 status-1-todo, tasks are task-1 (pos 0), task-5 (pos 1), task-6 (pos 2)
      expect(store.getState().tasks['task-1']?.position).toBe(0);
      expect(store.getState().tasks['task-5']?.position).toBe(1);
      expect(store.getState().tasks['task-6']?.position).toBe(2);

      // Delete task-1
      const res = store.getState().deleteTaskSync('task-1');
      expect(res.success).toBe(true);

      // Remaining task-5 and task-6 must be reindexed to positions 0 and 1
      const remainingT5 = store.getState().tasks['task-5']!;
      const remainingT6 = store.getState().tasks['task-6']!;
      expect(remainingT5.position).toBe(0);
      expect(remainingT6.position).toBe(1);

      const activeTasks = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-1' &&
            t.statusId === 'status-1-todo' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      expect(activeTasks.length).toBe(2);
      activeTasks.forEach((t, idx) => expect(t.position).toBe(idx));
    });
  });
});
