import { describe, it, expect } from 'vitest';
import {
  selectVisibleContainerTree,
  selectCurrentList,
  selectBreadcrumbs,
  selectArchivedRoots,
  getDescendantCounts,
  TreeNode,
} from '@/domain/selectors';
import { createSeedState } from '@/domain/fixtures';
import { canViewNode } from '@/domain/permissions';
import { isEffectivelyArchived } from '@/domain/validation';
import { BaseContainer } from '@/domain/types';
import { createFlowboardStore } from '@/store/createFlowboardStore';

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function walk(items: TreeNode[]) {
    for (const item of items) {
      result.push(item);
      if (item.children.length > 0) {
        walk(item.children);
      }
    }
  }
  walk(nodes);
  return result;
}

describe('Selectors Engine - Container Tree & Current List', () => {
  describe('D-023: selectVisibleContainerTree', () => {
    it('returns exact same reference when input references are unchanged (memoization)', () => {
      const seed = createSeedState();
      const tree1 = selectVisibleContainerTree(seed);
      const tree2 = selectVisibleContainerTree(seed);

      expect(tree1).toBe(tree2); // Strict reference equality
    });

    it('returns expected seed trees for Alice, Bob, and Carol', () => {
      const seed = createSeedState();

      // Alice (Admin): sees all active nodes
      const aliceTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-alice',
      });
      const aliceFlat = flattenTree(aliceTree).map((n) => n.id);
      expect(aliceFlat).toEqual([
        'ws-1',
        'space-1',
        'folder-1',
        'list-1',
        'list-2',
        'folder-2',
        'list-3',
        'space-2',
      ]);

      // Bob (Member): blocked from private folder-2 and list-3
      const bobTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-bob',
      });
      const bobFlat = flattenTree(bobTree).map((n) => n.id);
      expect(bobFlat).toEqual([
        'ws-1',
        'space-1',
        'folder-1',
        'list-1',
        'list-2',
        'space-2',
      ]);
      expect(bobFlat).not.toContain('folder-2');
      expect(bobFlat).not.toContain('list-3');

      // Carol (Member): sees private folder-2 and list-3 (allow grant), but list-2 is hidden via deny grant
      const carolTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-carol',
      });
      const carolFlat = flattenTree(carolTree).map((n) => n.id);
      expect(carolFlat).toEqual([
        'ws-1',
        'space-1',
        'folder-1',
        'list-1',
        'folder-2',
        'list-3',
        'space-2',
      ]);
      expect(carolFlat).not.toContain('list-2');
    });

    it('node set matches brute-force filter(canViewNode && not effectively archived) for all users', () => {
      const seed = createSeedState();
      const allNodes: Record<string, BaseContainer> = {
        ...seed.workspaces,
        ...seed.spaces,
        ...seed.folders,
        ...seed.lists,
      };

      for (const userId of ['user-alice', 'user-bob', 'user-carol']) {
        const state = { ...seed, currentUserId: userId };
        const tree = selectVisibleContainerTree(state);
        const treeNodeIds = new Set(flattenTree(tree).map((n) => n.id));

        const permState = { nodes: allNodes, grants: seed.grants };
        const currentUser = seed.users[userId];

        const bruteForceIds = new Set(
          Object.values(allNodes)
            .filter((node) => {
              if (isEffectivelyArchived(node.id, allNodes)) return false;
              return canViewNode(currentUser, node.id, permState);
            })
            .map((n) => n.id)
        );

        expect(treeNodeIds).toEqual(bruteForceIds);
      }
    });

    it('prunes entire subtree top-down when an ancestor is denied', () => {
      const seed = createSeedState();
      // Add deny on space-1 for Bob
      seed.grants['deny-space-1'] = {
        id: 'deny-space-1',
        resourceId: 'space-1',
        userId: 'user-bob',
        mode: 'deny',
      };

      const bobTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-bob',
      });
      const bobFlat = flattenTree(bobTree).map((n) => n.id);

      // space-1 and all its folders and lists must be absent
      expect(bobFlat).toEqual(['ws-1', 'space-2']);
    });

    it('prunes private space for ungranted members', () => {
      const seed = createSeedState();
      seed.spaces['space-1']!.visibility = 'private';

      const bobTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-bob',
      });
      const bobFlat = flattenTree(bobTree).map((n) => n.id);
      expect(bobFlat).toEqual(['ws-1', 'space-2']);
    });

    it('hides archived folder and its lists for all users including admin', () => {
      const seed = createSeedState();
      seed.folders['folder-1']!.archivedAt = '2026-10-10T12:00:00.000Z';

      const aliceTree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-alice',
      });
      const aliceFlat = flattenTree(aliceTree).map((n) => n.id);

      expect(aliceFlat).not.toContain('folder-1');
      expect(aliceFlat).not.toContain('list-1');
      expect(aliceFlat).not.toContain('list-2');
    });

    it('stale positions on archived nodes do not distort active sibling order', () => {
      const seed = createSeedState();
      // space-1 (pos 0), space-2 (pos 1). Archive space-1 with stale pos 0.
      seed.spaces['space-1']!.archivedAt = '2026-10-10T12:00:00.000Z';
      seed.spaces['space-1']!.position = 0;
      seed.spaces['space-2']!.position = 5; // Gapped position

      const tree = selectVisibleContainerTree({
        ...seed,
        currentUserId: 'user-alice',
      });
      const root = tree[0];
      expect(root?.children.map((c) => c.id)).toEqual(['space-2']);
    });

    it('corrupt data (orphan node or cyclic pair) never appears in tree and never crashes', () => {
      const seed = createSeedState();
      // Add orphan list with non-existent parent
      seed.lists['orphan-list'] = {
        id: 'orphan-list',
        name: 'Orphan List',
        type: 'list',
        parentId: 'non-existent-folder',
        position: 0,
        visibility: 'public',
        archivedAt: null,
        statusIds: [],
        createdAt: '',
        updatedAt: '',
      };

      // Add cyclic folder pair
      seed.folders['cycle-a'] = {
        id: 'cycle-a',
        name: 'Cycle A',
        type: 'folder',
        parentId: 'cycle-b',
        position: 0,
        visibility: 'public',
        archivedAt: null,
        createdAt: '',
        updatedAt: '',
      };
      seed.folders['cycle-b'] = {
        id: 'cycle-b',
        name: 'Cycle B',
        type: 'folder',
        parentId: 'cycle-a',
        position: 1,
        visibility: 'public',
        archivedAt: null,
        createdAt: '',
        updatedAt: '',
      };

      expect(() => {
        const tree = selectVisibleContainerTree(seed);
        const flat = flattenTree(tree).map((n) => n.id);
        expect(flat).not.toContain('orphan-list');
        expect(flat).not.toContain('cycle-a');
        expect(flat).not.toContain('cycle-b');
      }).not.toThrow();
    });

    it('frozen state is not mutated by selector', () => {
      const seed = createSeedState();
      Object.freeze(seed);
      Object.freeze(seed.spaces);
      Object.freeze(seed.folders);

      expect(() => {
        selectVisibleContainerTree(seed);
      }).not.toThrow();
    });
  });

  describe('D-027: selectCurrentList & selectList Check Order', () => {
    it('selectCurrentList returns exact same Result reference when inputs are unchanged (memoization)', () => {
      const seed = createSeedState();
      const res1 = selectCurrentList(seed);
      const res2 = selectCurrentList(seed);

      expect(res1).toBe(res2); // Strict reference equality
      expect(res1.success).toBe(true);
      if (res1.success) {
        expect(res1.data?.id).toBe('list-1');
      }
    });

    it('selectedListId === null returns ok(null) (neutral, not an error)', () => {
      const seed = createSeedState();
      seed.selectedListId = null;

      const res = selectCurrentList(seed);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBeNull();
      }
    });

    it('selectList check order: NOT_FOUND -> FORBIDDEN -> VALIDATION -> CONFLICT', () => {
      const store = createFlowboardStore();

      // Bob selects folder-2 -> FORBIDDEN (denied node never reveals its type!)
      store.getState().setCurrentUser('user-bob');
      const resBobFolder = store.getState().selectList('folder-2');
      expect(resBobFolder.success).toBe(false);
      if (!resBobFolder.success) {
        expect(resBobFolder.error.code).toBe('FORBIDDEN');
      }

      // Bob selects list-3 -> FORBIDDEN
      const resBobList3 = store.getState().selectList('list-3');
      expect(resBobList3.success).toBe(false);
      if (!resBobList3.success) {
        expect(resBobList3.error.code).toBe('FORBIDDEN');
      }

      // Carol selects list-2 -> FORBIDDEN (deny grant on list-2)
      store.getState().setCurrentUser('user-carol');
      const resCarolList2 = store.getState().selectList('list-2');
      expect(resCarolList2.success).toBe(false);
      if (!resCarolList2.success) {
        expect(resCarolList2.error.code).toBe('FORBIDDEN');
      }

      // Alice (Admin) selects folder-1 -> VALIDATION (non-list, revealed only because visible)
      store.getState().setCurrentUser('user-alice');
      const resAliceFolder = store.getState().selectList('folder-1');
      expect(resAliceFolder.success).toBe(false);
      if (!resAliceFolder.success) {
        expect(resAliceFolder.error.code).toBe('VALIDATION');
      }

      // Non-existent ID -> NOT_FOUND
      const resNotFound = store.getState().selectList('ghost-id');
      expect(resNotFound.success).toBe(false);
      if (!resNotFound.success) {
        expect(resNotFound.error.code).toBe('NOT_FOUND');
      }
    });

    it('REQUIRED TEST: archiving selected list retains selectedListId; selectCurrentList fails with CONFLICT; restoring brings it back', () => {
      const store = createFlowboardStore();
      expect(store.getState().selectedListId).toBe('list-1');

      // Archive folder-1 (parent of list-1)
      store.getState().archiveContainerSync('folder-1');

      // selectedListId is NOT cleared from state
      expect(store.getState().selectedListId).toBe('list-1');

      // selectCurrentList evaluates dynamically and returns CONFLICT
      const currentRes = selectCurrentList(store.getState());
      expect(currentRes.success).toBe(false);
      if (!currentRes.success) {
        expect(currentRes.error.code).toBe('CONFLICT');
      }

      // Restore folder-1
      store.getState().restoreContainerSync('folder-1');

      // selectCurrentList is valid again!
      const restoredRes = selectCurrentList(store.getState());
      expect(restoredRes.success).toBe(true);
      if (restoredRes.success) {
        expect(restoredRes.data?.id).toBe('list-1');
      }
    });
  });

  describe('D-028: selectArchivedRoots & getDescendantCounts', () => {
    it('selectArchivedRoots lists only archived roots whose ancestors are active', () => {
      const seed = createSeedState();
      // Archive folder-1 and list-1
      seed.folders['folder-1']!.archivedAt = '2026-10-10T10:00:00.000Z';
      seed.lists['list-1']!.archivedAt = '2026-10-10T10:00:00.000Z';

      const archivedRoots = selectArchivedRoots(seed);
      // folder-1 should be in roots, but list-1 should NOT (because its ancestor folder-1 is also archived)
      expect(archivedRoots.map((n) => n.id)).toEqual(['folder-1']);
    });

    it('getDescendantCounts calculates both active descendant containers AND tasks that will be hidden', () => {
      const seed = createSeedState();
      // Under folder-1: lists are list-1 (6 tasks) and list-2 (5 tasks) -> 2 containers, 11 tasks
      const counts = getDescendantCounts('folder-1', seed);
      expect(counts.containerCount).toBe(2);
      expect(counts.taskCount).toBe(11);
    });
  });

  describe('D-030: selectBreadcrumbs', () => {
    it('returns exact same reference when inputs are unchanged (reference memoization)', () => {
      const seed = createSeedState();
      const crumbs1 = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-1',
        currentUserId: 'user-alice',
      });
      const crumbs2 = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-1',
        currentUserId: 'user-alice',
      });

      expect(crumbs1).not.toBeNull();
      expect(crumbs1).toBe(crumbs2); // Strict reference equality
    });

    it('returns full 4-tier chain names for Alice viewing list-3 (Acme Corporation -> Product & Engineering -> Security & Compliance -> Vulnerabilities)', () => {
      const seed = createSeedState();
      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-3',
        currentUserId: 'user-alice',
      });

      expect(crumbs).not.toBeNull();
      expect(crumbs?.map((c) => c.name)).toEqual([
        'Acme Corporation',
        'Product & Engineering',
        'Security & Compliance',
        'Vulnerabilities',
      ]);
      expect(crumbs?.map((c) => c.type)).toEqual([
        'workspace',
        'space',
        'folder',
        'list',
      ]);
      expect(crumbs?.map((c) => c.id)).toEqual([
        'ws-1',
        'space-1',
        'folder-2',
        'list-3',
      ]);
    });

    it('returns null when user is forbidden (stale Bob on private list-3)', () => {
      const seed = createSeedState();
      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-3',
        currentUserId: 'user-bob',
      });

      expect(crumbs).toBeNull();
    });

    it('returns null when user has explicit deny (stale Carol on denied list-2)', () => {
      const seed = createSeedState();
      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-2',
        currentUserId: 'user-carol',
      });

      expect(crumbs).toBeNull();
    });

    it('returns null when selected list is archived or has an archived ancestor', () => {
      const seed = createSeedState();
      seed.folders['folder-1']!.archivedAt = '2026-10-10T12:00:00.000Z';

      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-1',
        currentUserId: 'user-alice',
      });

      expect(crumbs).toBeNull();
    });

    it('returns null when selectedListId is null', () => {
      const seed = createSeedState();
      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: null,
        currentUserId: 'user-alice',
      });

      expect(crumbs).toBeNull();
    });

    it('works on deeply frozen state without mutating anything', () => {
      const seed = createSeedState();
      Object.freeze(seed);
      Object.freeze(seed.workspaces);
      Object.freeze(seed.spaces);
      Object.freeze(seed.folders);
      Object.freeze(seed.lists);
      Object.freeze(seed.users);
      Object.freeze(seed.grants);

      const crumbs = selectBreadcrumbs({
        ...seed,
        selectedListId: 'list-1',
        currentUserId: 'user-alice',
      });

      expect(crumbs).not.toBeNull();
      expect(crumbs?.[3]?.name).toBe('Sprint Backlog');
    });
  });
});
