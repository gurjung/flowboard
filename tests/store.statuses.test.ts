import { describe, it, expect, beforeEach } from 'vitest';
import { createFlowboardStore } from '@/store/createFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { FlowboardStoreState, UpdateStatusPatch } from '@/store/types';

function assertMembershipConsistency(state: FlowboardStoreState): void {
  for (const list of Object.values(state.lists)) {
    const statusesInList = Object.values(state.statuses).filter(
      (s) => s.listId === list.id
    );
    const listStatusIdsSet = new Set(list.statusIds);
    const actualStatusIdsSet = new Set(statusesInList.map((s) => s.id));
    expect(listStatusIdsSet).toEqual(actualStatusIdsSet);
  }
}

describe('Store: Status Workflow Management & Invariants', () => {
  let store: ReturnType<typeof createFlowboardStore>;

  beforeEach(() => {
    store = createFlowboardStore(createSeedState(), { latencyMs: 0 });
    // Alice is Admin by default in seed
    store.getState().setCurrentUser('user-alice');
  });

  describe('D-044 & D-045: Guard Precedence, Probing & Membership Consistency', () => {
    it('verifies membership consistency on seed and after every status mutation', () => {
      assertMembershipConsistency(store.getState());

      // Create
      const created = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'Review',
        category: 'in_progress',
      });
      expect(created.success).toBe(true);
      assertMembershipConsistency(store.getState());

      // Update
      const updated = store
        .getState()
        .updateStatusSync(created.data!.id, { name: 'Code Review' });
      expect(updated.success).toBe(true);
      assertMembershipConsistency(store.getState());

      // Reorder (statusIds on list must NOT change)
      const listBefore = store.getState().lists['list-1']!;
      const listStatusIdsBefore = [...listBefore.statusIds];
      const reordered = store.getState().reorderStatusSync(created.data!.id, 0);
      expect(reordered.success).toBe(true);
      assertMembershipConsistency(store.getState());
      // list.statusIds is membership-only and never reordered
      expect(store.getState().lists['list-1']!.statusIds).toEqual(
        listStatusIdsBefore
      );

      // Delete
      const deleted = store
        .getState()
        .deleteStatusSync(created.data!.id, 'status-1-prog');
      expect(deleted.success).toBe(true);
      assertMembershipConsistency(store.getState());
    });

    it('non-admin on nonexistent status/list returns FORBIDDEN; admin on nonexistent returns NOT_FOUND', () => {
      // Bob (regular member)
      store.getState().setCurrentUser('user-bob');
      const nonAdminCreate = store.getState().createStatusSync({
        listId: 'nonexistent-list',
        name: 'New',
        category: 'todo',
      });
      expect(nonAdminCreate.success).toBe(false);
      expect(nonAdminCreate.error?.code).toBe('FORBIDDEN');

      const nonAdminUpdate = store
        .getState()
        .updateStatusSync('nonexistent-status', { name: 'New' });
      expect(nonAdminUpdate.success).toBe(false);
      expect(nonAdminUpdate.error?.code).toBe('FORBIDDEN');

      // Alice (Admin) on nonexistent returns NOT_FOUND
      store.getState().setCurrentUser('user-alice');
      const adminCreate = store.getState().createStatusSync({
        listId: 'nonexistent-list',
        name: 'New',
        category: 'todo',
      });
      expect(adminCreate.success).toBe(false);
      expect(adminCreate.error?.code).toBe('NOT_FOUND');

      const adminUpdate = store
        .getState()
        .updateStatusSync('nonexistent-status', { name: 'New' });
      expect(adminUpdate.success).toBe(false);
      expect(adminUpdate.error?.code).toBe('NOT_FOUND');
    });

    it('createStatus returns INVALID_PARENT when targeting a container that is not a list', () => {
      const res = store.getState().createStatusSync({
        listId: 'folder-1',
        name: 'Folder Status',
        category: 'todo',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INVALID_PARENT');
    });

    it('missing parent list node on update/reorder/delete returns CONFLICT corrupt hierarchy', () => {
      const seed = createSeedState();
      // s-orphaned references a nonexistent parent list
      seed.statuses['s-orphaned'] = {
        id: 's-orphaned',
        listId: 'nonexistent-list-orphan',
        name: 'Orphaned',
        category: 'todo',
        color: 'slate',
        position: 0,
      };
      const corruptStore = createFlowboardStore(seed);
      corruptStore.getState().setCurrentUser('user-alice');

      expect(
        corruptStore.getState().updateStatusSync('s-orphaned', { name: 'Foo' })
          .error?.code
      ).toBe('CONFLICT');
      expect(
        corruptStore.getState().reorderStatusSync('s-orphaned', 0).error?.code
      ).toBe('CONFLICT');
      expect(
        corruptStore.getState().deleteStatusSync('s-orphaned').error?.code
      ).toBe('CONFLICT');
    });

    it('order-pair tests: shape validation (step 5) runs before archived CONFLICT (step 6)', () => {
      store.getState().archiveContainerSync('list-1');

      // createStatus with invalid color token in archived list returns VALIDATION, not CONFLICT
      const createInvalidShape = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'Valid Name',
        category: 'todo',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        color: 'invalid-token' as any,
      });
      expect(createInvalidShape.success).toBe(false);
      expect(createInvalidShape.error?.code).toBe('VALIDATION');

      // deleteStatus with invalid fallbackStatusId type returns VALIDATION, not CONFLICT
      const deleteInvalidFallback = store
        .getState()
        .deleteStatusSync('status-1-qa', '');
      expect(deleteInvalidFallback.success).toBe(false);
      expect(deleteInvalidFallback.error?.code).toBe('VALIDATION');

      // reorderStatus with non-integer index (NaN) returns VALIDATION, not CONFLICT
      const reorderNonInt = store
        .getState()
        .reorderStatusSync('status-1-qa', NaN);
      expect(reorderNonInt.success).toBe(false);
      expect(reorderNonInt.error?.code).toBe('VALIDATION');
    });

    it('order-pair tests: archived CONFLICT (step 6) runs before business rules (step 7)', () => {
      store.getState().archiveContainerSync('list-1');

      // delete of last todo (status-1-todo) in an ARCHIVED list returns CONFLICT, not VALIDATION
      const delConflict = store.getState().deleteStatusSync('status-1-todo');
      expect(delConflict.success).toBe(false);
      expect(delConflict.error?.code).toBe('CONFLICT');

      // reorder out of range in an ARCHIVED list returns CONFLICT, not VALIDATION
      const reorderConflict = store
        .getState()
        .reorderStatusSync('status-1-qa', 999);
      expect(reorderConflict.success).toBe(false);
      expect(reorderConflict.error?.code).toBe('CONFLICT');
    });
  });

  describe('D-041 & D-047: createStatus Defaults & Positioning', () => {
    it('appends at position N and derives default color for all three categories', () => {
      // list-1 has 4 statuses initially (pos 0..3)
      const resTodo = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'Backlog Item',
        category: 'todo',
      });
      expect(resTodo.success).toBe(true);
      expect(resTodo.data?.position).toBe(4);
      expect(resTodo.data?.color).toBe('slate');

      const resProg = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'Deployment',
        category: 'in_progress',
      });
      expect(resProg.success).toBe(true);
      expect(resProg.data?.position).toBe(5);
      expect(resProg.data?.color).toBe('blue');

      const resDone = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'Verified',
        category: 'done',
      });
      expect(resDone.success).toBe(true);
      expect(resDone.data?.position).toBe(6);
      expect(resDone.data?.color).toBe('green');
    });

    it('rejects duplicate status name in the same list with VALIDATION', () => {
      const res = store.getState().createStatusSync({
        listId: 'list-1',
        name: 'to do', // case-insensitive match against 'To Do'
        category: 'todo',
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION');
      expect(res.error?.message).toContain('already exists');
    });
  });

  describe('D-047: updateStatus Whitelist, Self-Rename & Reference Stability', () => {
    it('rejects unknown or immutable keys with VALIDATION', () => {
      expect(
        store.getState().updateStatusSync('status-1-qa', {
          category: 'done',
        } as unknown as UpdateStatusPatch).error?.code
      ).toBe('VALIDATION');

      expect(
        store.getState().updateStatusSync('status-1-qa', {
          id: 'new-id',
        } as unknown as UpdateStatusPatch).error?.code
      ).toBe('VALIDATION');

      expect(
        store.getState().updateStatusSync('status-1-qa', {
          name: undefined,
        }).error?.code
      ).toBe('VALIDATION');
    });

    it('allows case-only rename of the same status', () => {
      const res = store
        .getState()
        .updateStatusSync('status-1-qa', { name: 'qa' });
      expect(res.success).toBe(true);
      expect(res.data?.name).toBe('qa');
    });

    it('no-op patch returns unchanged state reference', () => {
      const stateBefore = store.getState();
      const res1 = store.getState().updateStatusSync('status-1-qa', {});
      expect(res1.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);

      const status = stateBefore.statuses['status-1-qa']!;
      const res2 = store.getState().updateStatusSync('status-1-qa', {
        name: status.name,
        color: status.color as 'amber',
      });
      expect(res2.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });
  });

  describe('D-043: reorderStatus Index Validation & Reference Stability', () => {
    it('validates non-integer and out-of-range indices: NaN, 1.5, -1, N, Infinity', () => {
      // In list-1, 4 statuses (0..3). N = 4.
      expect(
        store.getState().reorderStatusSync('status-1-qa', NaN).error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().reorderStatusSync('status-1-qa', 1.5).error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().reorderStatusSync('status-1-qa', -1).error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().reorderStatusSync('status-1-qa', 4).error?.code
      ).toBe('VALIDATION');
      expect(
        store.getState().reorderStatusSync('status-1-qa', Infinity).error?.code
      ).toBe('VALIDATION');
    });

    it('reorderStatus with same index = no-op success with unchanged state reference', () => {
      const stateBefore = store.getState();
      const pos = stateBefore.statuses['status-1-qa']!.position;
      const res = store.getState().reorderStatusSync('status-1-qa', pos);
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });

    it('reference stability: only statuses whose position actually changed are rewritten', () => {
      // list-1 statuses:
      // pos 0: status-1-todo
      // pos 1: status-1-prog
      // pos 2: status-1-qa
      // pos 3: status-1-done
      const todoBefore = store.getState().statuses['status-1-todo']!;
      const doneBefore = store.getState().statuses['status-1-done']!;

      // Swap status-1-qa (pos 2) with status-1-prog (pos 1): move status-1-qa to index 1
      const res = store.getState().reorderStatusSync('status-1-qa', 1);
      expect(res.success).toBe(true);

      const stateAfter = store.getState();
      // status-1-todo (pos 0) and status-1-done (pos 3) did NOT change position -> must be reference-equal!
      expect(stateAfter.statuses['status-1-todo']).toBe(todoBefore);
      expect(stateAfter.statuses['status-1-done']).toBe(doneBefore);

      expect(stateAfter.statuses['status-1-qa']?.position).toBe(1);
      expect(stateAfter.statuses['status-1-prog']?.position).toBe(2);
    });
  });

  describe('D-042: deleteStatus Invariants, Fallback & Task Migration', () => {
    it('delete with no fallback when status has only soft-deleted tasks succeeds and remaps them', () => {
      // status-1-qa currently has 0 active tasks and 0 soft-deleted tasks.
      // Let's create a task, move it to status-1-qa, then soft-delete it.
      const taskRes = store.getState().createTaskSync({
        listId: 'list-1',
        title: 'Task for QA',
        statusId: 'status-1-qa',
      });
      expect(taskRes.success).toBe(true);
      const taskId = taskRes.data!.id;

      // Soft delete it
      store.getState().deleteTaskSync(taskId);
      expect(store.getState().tasks[taskId]?.archivedAt).not.toBeNull();

      // Delete status-1-qa with NO fallback supplied
      const delRes = store.getState().deleteStatusSync('status-1-qa');
      expect(delRes.success).toBe(true);

      // Status is permanently hard-deleted
      expect(store.getState().statuses['status-1-qa']).toBeUndefined();
      expect(store.getState().lists['list-1']?.statusIds).not.toContain(
        'status-1-qa'
      );

      // Soft-deleted task is remapped to first remaining same-category status (status-1-prog)
      const remappedTask = store.getState().tasks[taskId]!;
      expect(remappedTask.statusId).toBe('status-1-prog');

      // Stale position of remapped soft-deleted task never affects active column contiguity
      const activeInProg = Object.values(store.getState().tasks)
        .filter(
          (t) =>
            t.primaryListId === 'list-1' &&
            t.statusId === 'status-1-prog' &&
            t.archivedAt === null
        )
        .sort((a, b) => a.position - b.position);
      activeInProg.forEach((t, idx) => expect(t.position).toBe(idx));
    });

    it('reference stability: tasks outside migrated tasks remain strictly reference-equal', () => {
      // Create a task in status-1-qa
      const tQARes = store.getState().createTaskSync({
        listId: 'list-1',
        title: 'Active in QA',
        statusId: 'status-1-qa',
      });
      const tQAId = tQARes.data!.id;

      const task1Before = store.getState().tasks['task-1']!;
      const task2Before = store.getState().tasks['task-2']!;

      // Delete status-1-qa with fallback status-1-prog
      const delRes = store
        .getState()
        .deleteStatusSync('status-1-qa', 'status-1-prog');
      expect(delRes.success).toBe(true);

      const stateAfter = store.getState();
      // task-1 and task-2 are untouched and must maintain reference equality!
      expect(stateAfter.tasks['task-1']).toBe(task1Before);
      expect(stateAfter.tasks['task-2']).toBe(task2Before);

      // Migrated task position is appended to fallback column
      const migrated = stateAfter.tasks[tQAId]!;
      expect(migrated.statusId).toBe('status-1-prog');
    });

    it('simulated latency: mutation takes effect synchronously before delay', () => {
      const slowStore = createFlowboardStore(createSeedState(), {
        latencyMs: 500,
      });
      slowStore.getState().setCurrentUser('user-alice');

      void slowStore.getState().deleteStatusSync('status-1-qa');

      // Synchronously deleted before await!
      expect(slowStore.getState().statuses['status-1-qa']).toBeUndefined();
    });

    it('two stores remain completely isolated', () => {
      const storeA = createFlowboardStore(createSeedState());
      const storeB = createFlowboardStore(createSeedState());
      storeA.getState().setCurrentUser('user-alice');
      storeB.getState().setCurrentUser('user-alice');

      storeA.getState().deleteStatusSync('status-1-qa');
      expect(storeA.getState().statuses['status-1-qa']).toBeUndefined();
      expect(storeB.getState().statuses['status-1-qa']).toBeDefined();
    });
  });
});
