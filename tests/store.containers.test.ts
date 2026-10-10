import { describe, it, expect } from 'vitest';
import { createFlowboardStore } from '@/store/createFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { BaseContainer } from '@/domain/types';

describe('Flowboard Store - Container Operations & Guards', () => {
  it('failure paths return before calling set() so state reference equality is preserved', () => {
    const store = createFlowboardStore();
    const stateBefore = store.getState();

    // Trigger a validation failure: empty name
    const result = store.getState().createContainerSync({
      type: 'space',
      parentId: 'ws-1',
      name: '   ',
    });

    expect(result.success).toBe(false);
    expect(store.getState()).toBe(stateBefore); // Exact reference equality
  });

  describe('Guard Tier 1: Permission checks & fail-closed behavior', () => {
    it('non-admin users (Bob, Carol) receive FORBIDDEN on every container mutation', () => {
      const store = createFlowboardStore();

      for (const nonAdminId of ['user-bob', 'user-carol']) {
        store.getState().setCurrentUser(nonAdminId);

        const resCreate = store.getState().createContainerSync({
          type: 'space',
          parentId: 'ws-1',
          name: 'New Space',
        });
        expect(resCreate.success).toBe(false);
        if (!resCreate.success) {
          expect(resCreate.error.code).toBe('FORBIDDEN');
        }

        const resRename = store
          .getState()
          .renameContainerSync('space-1', 'Renamed');
        expect(resRename.success).toBe(false);
        if (!resRename.success) {
          expect(resRename.error.code).toBe('FORBIDDEN');
        }

        const resReorder = store.getState().reorderContainerSync('space-1', 1);
        expect(resReorder.success).toBe(false);
        if (!resReorder.success) {
          expect(resReorder.error.code).toBe('FORBIDDEN');
        }

        const resArchive = store.getState().archiveContainerSync('space-1');
        expect(resArchive.success).toBe(false);
        if (!resArchive.success) {
          expect(resArchive.error.code).toBe('FORBIDDEN');
        }

        const resRestore = store.getState().restoreContainerSync('space-1');
        expect(resRestore.success).toBe(false);
        if (!resRestore.success) {
          expect(resRestore.error.code).toBe('FORBIDDEN');
        }
      }
    });

    it('tier 1 precedence: non-admin gets FORBIDDEN on non-existent ID, while admin gets NOT_FOUND', () => {
      const store = createFlowboardStore();

      // Bob (member) targets non-existent ID -> FORBIDDEN (prevents ID enumeration)
      store.getState().setCurrentUser('user-bob');
      const bobRes = store
        .getState()
        .renameContainerSync('ghost-node-404', 'Ghost');
      expect(bobRes.success).toBe(false);
      if (!bobRes.success) {
        expect(bobRes.error.code).toBe('FORBIDDEN');
      }

      // Alice (admin) targets non-existent ID -> NOT_FOUND
      store.getState().setCurrentUser('user-alice');
      const aliceRes = store
        .getState()
        .renameContainerSync('ghost-node-404', 'Ghost');
      expect(aliceRes.success).toBe(false);
      if (!aliceRes.success) {
        expect(aliceRes.error.code).toBe('NOT_FOUND');
      }
    });

    it('unknown currentUserId inside store fails closed with FORBIDDEN', () => {
      const seed = createSeedState();
      // Force an unknown user ID into initial seed
      seed.currentUserId = 'ghost-user';
      const store = createFlowboardStore(seed);

      const res = store.getState().createContainerSync({
        type: 'space',
        parentId: 'ws-1',
        name: 'Fail Closed Space',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('D-021 Workspace restrictions & status codes', () => {
    it('createContainer(type: workspace) -> INVALID_PARENT', () => {
      const store = createFlowboardStore();
      const res = store.getState().createContainerSync({
        type: 'workspace',
        parentId: null,
        name: 'Second Workspace',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('INVALID_PARENT');
      }
    });

    it('archiveContainer(workspaceId) -> VALIDATION', () => {
      const store = createFlowboardStore();
      const res = store.getState().archiveContainerSync('ws-1');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION');
      }
    });

    it('reorderContainer(workspaceId, newIndex) -> VALIDATION', () => {
      const store = createFlowboardStore();
      const res = store.getState().reorderContainerSync('ws-1', 0);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION');
      }
    });

    it('renameContainer(workspaceId, name) is allowed and updates workspace name', () => {
      const store = createFlowboardStore();
      const res = store
        .getState()
        .renameContainerSync('ws-1', 'Acme Global Enterprises');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe('Acme Global Enterprises');
        expect(store.getState().workspaces['ws-1']?.name).toBe(
          'Acme Global Enterprises'
        );
      }
    });
  });

  describe('Container Creation & Parent-Type Validation', () => {
    it('enforces parent-type matrix: space->ws, folder->space, list->folder', () => {
      const store = createFlowboardStore();

      // Disallowed: folder under workspace
      const badFolder = store.getState().createContainerSync({
        type: 'folder',
        parentId: 'ws-1',
        name: 'Invalid Folder',
      });
      expect(badFolder.success).toBe(false);
      if (!badFolder.success) {
        expect(badFolder.error.code).toBe('INVALID_PARENT');
      }

      // Disallowed: list under space (strict hierarchy per D-002)
      const badList = store.getState().createContainerSync({
        type: 'list',
        parentId: 'space-1',
        name: 'Invalid List',
      });
      expect(badList.success).toBe(false);
      if (!badList.success) {
        expect(badList.error.code).toBe('INVALID_PARENT');
      }

      // Disallowed: space under folder
      const badSpace = store.getState().createContainerSync({
        type: 'space',
        parentId: 'folder-1',
        name: 'Invalid Space',
      });
      expect(badSpace.success).toBe(false);
      if (!badSpace.success) {
        expect(badSpace.error.code).toBe('INVALID_PARENT');
      }
    });

    it('creates container, appends to active siblings, returns new node payload, and allows duplicate names', () => {
      const store = createFlowboardStore();

      // space-1 (pos 0) and space-2 (pos 1) exist under ws-1
      const res = store.getState().createContainerSync({
        type: 'space',
        parentId: 'ws-1',
        name: 'Product & Engineering', // Duplicate sibling name allowed
      });

      expect(res.success).toBe(true);
      if (res.success) {
        const newSpace = res.data;
        expect(newSpace.name).toBe('Product & Engineering');
        expect(newSpace.type).toBe('space');
        expect(newSpace.parentId).toBe('ws-1');
        expect(newSpace.position).toBe(2); // Appended at index 2
        expect(newSpace.visibility).toBe('public');
        expect(newSpace.archivedAt).toBeNull();
        expect(store.getState().spaces[newSpace.id]).toBeDefined();
      }
    });
  });

  describe('Container Renaming', () => {
    it('renames container and updates updatedAt', () => {
      const store = createFlowboardStore(createSeedState(), {
        now: () => '2026-10-10T15:00:00.000Z',
      });

      const res = store
        .getState()
        .renameContainerSync('folder-1', 'Platform Engineering');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe('Platform Engineering');
        expect(res.data.updatedAt).toBe('2026-10-10T15:00:00.000Z');
      }
    });

    it('same-name rename is a no-op that preserves state reference equality', () => {
      const store = createFlowboardStore();
      const stateBefore = store.getState();

      const res = store
        .getState()
        .renameContainerSync('folder-1', 'Core Platform');
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });

    it('rejects invalid names with VALIDATION error', () => {
      const store = createFlowboardStore();
      const resEmpty = store.getState().renameContainerSync('folder-1', '   ');
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.error.code).toBe('VALIDATION');
      }
    });
  });

  describe('Container Reordering', () => {
    it('reorders container to final target index [A,B,C] -> move A to 2 -> [B,C,A] and returns void', () => {
      const store = createFlowboardStore();
      // Add third space 'space-3' to have [space-1 (0), space-2 (1), space-3 (2)]
      const createRes = store.getState().createContainerSync({
        type: 'space',
        parentId: 'ws-1',
        name: 'Space 3',
      });
      expect(createRes.success).toBe(true);
      const space3Id = (createRes as { success: true; data: BaseContainer })
        .data.id;

      // Move space-1 from index 0 to final index 2 -> [space-2, space-3, space-1]
      const reorderRes = store.getState().reorderContainerSync('space-1', 2);
      expect(reorderRes.success).toBe(true);
      if (reorderRes.success) {
        expect(reorderRes.data).toBeUndefined(); // Void payload
      }

      const spaces = store.getState().spaces;
      expect(spaces['space-2']?.position).toBe(0);
      expect(spaces[space3Id]?.position).toBe(1);
      expect(spaces['space-1']?.position).toBe(2);
    });

    it('same-index reorder is a no-op that preserves exact state reference', () => {
      const store = createFlowboardStore();
      const stateBefore = store.getState();

      const res = store.getState().reorderContainerSync('space-1', 0);
      expect(res.success).toBe(true);
      expect(store.getState()).toBe(stateBefore);
    });

    it('rejects out of bounds newIndex with VALIDATION', () => {
      const store = createFlowboardStore();
      const resNegative = store.getState().reorderContainerSync('space-1', -1);
      expect(resNegative.success).toBe(false);
      if (!resNegative.success) {
        expect(resNegative.error.code).toBe('VALIDATION');
      }

      const resOutOfBounds = store
        .getState()
        .reorderContainerSync('space-1', 99);
      expect(resOutOfBounds.success).toBe(false);
      if (!resOutOfBounds.success) {
        expect(resOutOfBounds.error.code).toBe('VALIDATION');
      }
    });
  });

  describe('Container Archive, Restore & Lifecycle Guards', () => {
    it('archive reindexes active siblings, leaves descendants reference-equal, and sets archivedAt', () => {
      const store = createFlowboardStore();
      const initialList1 = store.getState().lists['list-1'];
      const initialList2 = store.getState().lists['list-2'];

      // Archive folder-1 (parent of list-1 and list-2)
      // Active sibling folder-2 should be reindexed to position 0
      const res = store.getState().archiveContainerSync('folder-1');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.archivedAt).not.toBeNull();
      }

      // Descendants remain untouched in state (reference equality preserved)
      expect(store.getState().lists['list-1']).toBe(initialList1);
      expect(store.getState().lists['list-2']).toBe(initialList2);

      // Remaining active sibling folder-2 was reindexed from position 1 to position 0
      expect(store.getState().folders['folder-2']?.position).toBe(0);
    });

    it('generic target effectively archived guard prevents create/rename/reorder/archive on archived nodes', () => {
      const store = createFlowboardStore();
      store.getState().archiveContainerSync('folder-1');

      // Cannot create under archived parent -> CONFLICT
      const resCreate = store.getState().createContainerSync({
        type: 'list',
        parentId: 'folder-1',
        name: 'New List Under Archived Folder',
      });
      expect(resCreate.success).toBe(false);
      if (!resCreate.success) {
        expect(resCreate.error.code).toBe('CONFLICT');
      }

      // Cannot rename archived node -> CONFLICT
      const resRename = store
        .getState()
        .renameContainerSync('folder-1', 'Renamed');
      expect(resRename.success).toBe(false);
      if (!resRename.success) {
        expect(resRename.error.code).toBe('CONFLICT');
      }

      // Cannot reorder archived node -> CONFLICT
      const resReorder = store.getState().reorderContainerSync('folder-1', 0);
      expect(resReorder.success).toBe(false);
      if (!resReorder.success) {
        expect(resReorder.error.code).toBe('CONFLICT');
      }

      // Cannot double archive -> CONFLICT
      const resArchive = store.getState().archiveContainerSync('folder-1');
      expect(resArchive.success).toBe(false);
      if (!resArchive.success) {
        expect(resArchive.error.code).toBe('CONFLICT');
      }
    });

    it('REQUIRED TEST: folder-1 archived, list-1 never archived itself, restore(list-1) -> CONFLICT "already active"', () => {
      const store = createFlowboardStore();
      // Archive folder-1; list-1 is NOT archived itself (list-1.archivedAt remains null)
      store.getState().archiveContainerSync('folder-1');
      expect(store.getState().lists['list-1']?.archivedAt).toBeNull();

      // Calling restore on list-1 must fail with CONFLICT "already active"
      const res = store.getState().restoreContainerSync('list-1');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
        expect(res.error.message).toMatch(/already active/i);
      }
    });

    it('restore fails with CONFLICT if node was archived but parent is still archived', () => {
      const store = createFlowboardStore();
      // Archive list-1 first
      const arcList = store.getState().archiveContainerSync('list-1');
      expect(arcList.success).toBe(true);

      // Now archive parent folder-1
      const arcFolder = store.getState().archiveContainerSync('folder-1');
      expect(arcFolder.success).toBe(true);

      // Attempting to restore list-1 while folder-1 is archived -> CONFLICT "restore parent first"
      const res = store.getState().restoreContainerSync('list-1');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
        expect(res.error.message).toMatch(/restore parent first/i);
      }
    });

    it('restoring parent first allows subsequent child restore and appends to active siblings', () => {
      const store = createFlowboardStore();
      // Archive folder-1 and list-1
      store.getState().archiveContainerSync('list-1');
      store.getState().archiveContainerSync('folder-1');

      // Restore folder-1 first
      const resParent = store.getState().restoreContainerSync('folder-1');
      expect(resParent.success).toBe(true);

      // Now restore list-1 -> success!
      const resChild = store.getState().restoreContainerSync('list-1');
      expect(resChild.success).toBe(true);
      if (resChild.success) {
        expect(resChild.data.archivedAt).toBeNull();
        // list-2 is active (pos 0), so restored list-1 gets position 1
        expect(resChild.data.position).toBe(1);
      }
    });

    it('corrupt ancestor chain returns CONFLICT "Corrupt container hierarchy"', () => {
      const seed = createSeedState();
      // Create broken link
      seed.folders['folder-1']!.parentId = 'ghost-space';
      const store = createFlowboardStore(seed);

      const res = store.getState().renameContainerSync('folder-1', 'Renamed');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONFLICT');
        expect(res.error.message).toMatch(/corrupt/i);
      }
    });
  });

  describe('D-022 Latency wrapper & Synchronous mutation execution', () => {
    it('mutation executes synchronously before the first await; resolution promise is delayed', async () => {
      const store = createFlowboardStore(createSeedState(), {
        latencyMs: 50,
      });

      // Call action without awaiting
      const promise = store.getState().createContainer({
        type: 'space',
        parentId: 'ws-1',
        name: 'Instant Space',
      });

      // Assert state changed IMMEDIATELY (identity bound synchronously at click time)
      const spaces = Object.values(store.getState().spaces);
      const instantSpace = spaces.find((s) => s.name === 'Instant Space');
      expect(instantSpace).toBeDefined();

      // Now await promise resolution
      const result = await promise;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(instantSpace?.id);
      }
    });

    it('expected failures resolve as Result and never reject the returned promise', async () => {
      const store = createFlowboardStore(createSeedState(), {
        latencyMs: 10,
      });

      // Calling with invalid input does NOT reject
      const result = await store.getState().createContainer({
        type: 'space',
        parentId: 'ws-1',
        name: '', // Empty name validation error
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION');
      }
    });
  });

  describe('Store Isolation & Injected Dependencies', () => {
    it('injected deps (now, newId) are used during mutations', () => {
      let callCount = 0;
      const customNow = () => '2026-12-25T00:00:00.000Z';
      const customNewId = () => `custom-id-${++callCount}`;

      const store = createFlowboardStore(createSeedState(), {
        now: customNow,
        newId: customNewId,
      });

      const res = store.getState().createContainerSync({
        type: 'space',
        parentId: 'ws-1',
        name: 'Custom Dep Space',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe('custom-id-1');
        expect(res.data.createdAt).toBe('2026-12-25T00:00:00.000Z');
      }
    });

    it('two store instances are completely isolated from each other', () => {
      const storeA = createFlowboardStore();
      const storeB = createFlowboardStore();

      storeA.getState().renameContainerSync('space-1', 'Renamed Only In A');

      expect(storeA.getState().spaces['space-1']?.name).toBe(
        'Renamed Only In A'
      );
      expect(storeB.getState().spaces['space-1']?.name).toBe(
        'Product & Engineering'
      );
    });

    it('state is treated as immutable and not mutated in place', () => {
      const store = createFlowboardStore();
      const state1 = store.getState();
      Object.freeze(state1);
      Object.freeze(state1.spaces);
      Object.freeze(state1.spaces['space-1']);

      // Mutation should succeed without throwing frozen object modification errors
      expect(() => {
        store.getState().renameContainerSync('space-1', 'New Unfrozen Name');
      }).not.toThrow();

      expect(store.getState().spaces['space-1']?.name).toBe(
        'New Unfrozen Name'
      );
    });
  });

  describe('Session Slice', () => {
    it('setCurrentUser sets current user or returns NOT_FOUND if unknown', () => {
      const store = createFlowboardStore();

      const okRes = store.getState().setCurrentUser('user-bob');
      expect(okRes.success).toBe(true);
      expect(store.getState().currentUserId).toBe('user-bob');

      const failRes = store.getState().setCurrentUser('user-unknown');
      expect(failRes.success).toBe(false);
      if (!failRes.success) {
        expect(failRes.error.code).toBe('NOT_FOUND');
      }
      expect(store.getState().currentUserId).toBe('user-bob'); // State unchanged
    });

    it('setSelectedList sets list or null, or returns NOT_FOUND if unknown list', () => {
      const store = createFlowboardStore();

      const okList = store.getState().setSelectedList('list-2');
      expect(okList.success).toBe(true);
      expect(store.getState().selectedListId).toBe('list-2');

      const okNull = store.getState().setSelectedList(null);
      expect(okNull.success).toBe(true);
      expect(store.getState().selectedListId).toBeNull();

      const failList = store.getState().setSelectedList('ghost-list');
      expect(failList.success).toBe(false);
      if (!failList.success) {
        expect(failList.error.code).toBe('NOT_FOUND');
      }
      expect(store.getState().selectedListId).toBeNull();
    });
  });
});
