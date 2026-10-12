import { describe, it, expect } from 'vitest';
import {
  canViewNode,
  canEditTasksInList,
  canManageContainers,
  canMoveTask,
  getAncestorChain,
  toPermissionState,
  PermissionState,
} from '@/domain/permissions';
import { createSeedState } from '@/domain/fixtures';
import { BaseContainer, Grant, User } from '@/domain/types';

describe('Permission Engine (Pure Functions)', () => {
  const seedState = createSeedState();
  const permState = toPermissionState(seedState);
  const alice = seedState.users['user-alice']!;
  const bob = seedState.users['user-bob']!;
  const carol = seedState.users['user-carol']!;

  describe('Seed Fixture Permission Matrix (Alice vs Bob vs Carol)', () => {
    it('Alice (admin) sees all containers in workspace', () => {
      const allNodeIds = [
        'ws-1',
        'space-1',
        'space-2',
        'folder-1',
        'folder-2',
        'list-1',
        'list-2',
        'list-3',
      ];

      for (const id of allNodeIds) {
        expect(canViewNode(alice, id, permState)).toBe(true);
      }

      expect(canEditTasksInList(alice, 'list-1', permState)).toBe(true);
      expect(canEditTasksInList(alice, 'list-2', permState)).toBe(true);
      expect(canEditTasksInList(alice, 'list-3', permState)).toBe(true);
      expect(canManageContainers(alice)).toBe(true);
    });

    it('Bob (member) sees core platform (Lists 1 & 2), but blocked from private Folder 2 & List 3', () => {
      expect(canViewNode(bob, 'ws-1', permState)).toBe(true);
      expect(canViewNode(bob, 'space-1', permState)).toBe(true);
      expect(canViewNode(bob, 'space-2', permState)).toBe(true);
      expect(canViewNode(bob, 'folder-1', permState)).toBe(true);
      expect(canViewNode(bob, 'list-1', permState)).toBe(true);
      expect(canViewNode(bob, 'list-2', permState)).toBe(true);

      // Private Security & Compliance folder with no grant
      expect(canViewNode(bob, 'folder-2', permState)).toBe(false);
      expect(canViewNode(bob, 'list-3', permState)).toBe(false);

      expect(canEditTasksInList(bob, 'list-1', permState)).toBe(true);
      expect(canEditTasksInList(bob, 'list-2', permState)).toBe(true);
      expect(canEditTasksInList(bob, 'list-3', permState)).toBe(false);
      expect(canManageContainers(bob)).toBe(false);
    });

    it('Carol (member) sees Lists 1 & 3; blocked from List 2 via explicit deny', () => {
      expect(canViewNode(carol, 'ws-1', permState)).toBe(true);
      expect(canViewNode(carol, 'space-1', permState)).toBe(true);
      expect(canViewNode(carol, 'space-2', permState)).toBe(true);
      expect(canViewNode(carol, 'folder-1', permState)).toBe(true);
      expect(canViewNode(carol, 'list-1', permState)).toBe(true);

      // Explicit deny on Bug Triage (list-2)
      expect(canViewNode(carol, 'list-2', permState)).toBe(false);

      // Allowed on private Security folder (folder-2), which reaches list-3
      expect(canViewNode(carol, 'folder-2', permState)).toBe(true);
      expect(canViewNode(carol, 'list-3', permState)).toBe(true);

      expect(canEditTasksInList(carol, 'list-1', permState)).toBe(true);
      expect(canEditTasksInList(carol, 'list-2', permState)).toBe(false);
      expect(canEditTasksInList(carol, 'list-3', permState)).toBe(true);
      expect(canManageContainers(carol)).toBe(false);
    });
  });

  describe('Edge Cases on Custom Topologies', () => {
    const memberUser: User = {
      id: 'usr-test',
      name: 'Test Member',
      email: 'test@acme.com',
      role: 'member',
    };

    function createMiniState(
      customNodes?: Record<string, BaseContainer>,
      customGrants?: Grant[]
    ): PermissionState {
      const defaultNodes: Record<string, BaseContainer> = {
        ws: {
          id: 'ws',
          name: 'Workspace',
          type: 'workspace',
          parentId: null,
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
        sp: {
          id: 'sp',
          name: 'Space',
          type: 'space',
          parentId: 'ws',
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
        fd: {
          id: 'fd',
          name: 'Folder',
          type: 'folder',
          parentId: 'sp',
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
        ls: {
          id: 'ls',
          name: 'List',
          type: 'list',
          parentId: 'fd',
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
      };

      return {
        nodes: { ...defaultNodes, ...customNodes },
        grants: customGrants ?? [],
      };
    }

    it('Deny beats Allow when conflicting grants exist on the same node', () => {
      const state = createMiniState(undefined, [
        { id: 'g1', resourceId: 'ls', userId: memberUser.id, mode: 'allow' },
        { id: 'g2', resourceId: 'ls', userId: memberUser.id, mode: 'deny' },
      ]);

      expect(canViewNode(memberUser, 'ls', state)).toBe(false);
    });

    it('Duplicate grants do not alter deterministic resolution', () => {
      const state = createMiniState(
        {
          fd: {
            id: 'fd',
            name: 'Folder',
            type: 'folder',
            parentId: 'sp',
            position: 0,
            visibility: 'private',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        [
          { id: 'g1', resourceId: 'fd', userId: memberUser.id, mode: 'allow' },
          { id: 'g2', resourceId: 'fd', userId: memberUser.id, mode: 'allow' },
        ]
      );

      expect(canViewNode(memberUser, 'fd', state)).toBe(true);
      expect(canViewNode(memberUser, 'ls', state)).toBe(true);
    });

    it('Subtree Deny: Deny on an ancestor hides the entire descendant subtree', () => {
      const state = createMiniState(undefined, [
        { id: 'g1', resourceId: 'sp', userId: memberUser.id, mode: 'deny' },
        // Even with an allow on the child folder and grandchild list
        { id: 'g2', resourceId: 'fd', userId: memberUser.id, mode: 'allow' },
        { id: 'g3', resourceId: 'ls', userId: memberUser.id, mode: 'allow' },
      ]);

      expect(canViewNode(memberUser, 'ws', state)).toBe(true);
      expect(canViewNode(memberUser, 'sp', state)).toBe(false);
      expect(canViewNode(memberUser, 'fd', state)).toBe(false);
      expect(canViewNode(memberUser, 'ls', state)).toBe(false);
    });

    it('Allow reaching descendants: Allow on private Folder unlocks child List', () => {
      const state = createMiniState(
        {
          fd: {
            id: 'fd',
            name: 'Private Folder',
            type: 'folder',
            parentId: 'sp',
            position: 0,
            visibility: 'private',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        [{ id: 'g1', resourceId: 'fd', userId: memberUser.id, mode: 'allow' }]
      );

      expect(canViewNode(memberUser, 'fd', state)).toBe(true);
      expect(canViewNode(memberUser, 'ls', state)).toBe(true);
    });

    it('Allow on a descendant does NOT unlock a private ancestor', () => {
      // Folder is private. Allow grant is granted ONLY on List.
      // Rule: An allow only flows downward; it never unlocks a private ancestor.
      // Therefore, private Folder remains invisible, AND List is also invisible
      // because its ancestor Folder is blocked.
      const state = createMiniState(
        {
          fd: {
            id: 'fd',
            name: 'Private Folder',
            type: 'folder',
            parentId: 'sp',
            position: 0,
            visibility: 'private',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        [{ id: 'g1', resourceId: 'ls', userId: memberUser.id, mode: 'allow' }]
      );

      expect(canViewNode(memberUser, 'fd', state)).toBe(false);
      expect(canViewNode(memberUser, 'ls', state)).toBe(false);
    });

    it('Nested private barriers require allows on all private ancestors in chain', () => {
      // Both Space and Folder are private
      const state = createMiniState(
        {
          sp: {
            id: 'sp',
            name: 'Private Space',
            type: 'space',
            parentId: 'ws',
            position: 0,
            visibility: 'private',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
          fd: {
            id: 'fd',
            name: 'Private Folder',
            type: 'folder',
            parentId: 'sp',
            position: 0,
            visibility: 'private',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        // Only Folder is allowed; Space has no allow
        [{ id: 'g1', resourceId: 'fd', userId: memberUser.id, mode: 'allow' }]
      );

      // Space is private and unallowed -> false
      expect(canViewNode(memberUser, 'sp', state)).toBe(false);
      // Folder is under an unallowed private Space -> false
      expect(canViewNode(memberUser, 'fd', state)).toBe(false);
      // List is also invisible
      expect(canViewNode(memberUser, 'ls', state)).toBe(false);
    });
  });

  describe('Fail-Closed Behavior on Invalid Inputs & Corrupted Graphs', () => {
    it('returns false for null or undefined user', () => {
      expect(canViewNode(null, 'ws-1', permState)).toBe(false);
      expect(canViewNode(undefined, 'ws-1', permState)).toBe(false);
      expect(canEditTasksInList(null, 'list-1', permState)).toBe(false);
      expect(canManageContainers(null)).toBe(false);
      expect(canMoveTask(null, 'list-1', 'list-2', permState)).toBe(false);
    });

    it('returns false for user with missing id or role', () => {
      const invalidUser1 = {
        id: '',
        name: 'Ghost',
        email: '',
        role: 'member' as const,
      };
      const invalidUser2 = {
        id: 'u1',
        name: 'Ghost',
        email: '',
        role: '' as unknown as 'member',
      };

      expect(canViewNode(invalidUser1, 'ws-1', permState)).toBe(false);
      expect(canViewNode(invalidUser2, 'ws-1', permState)).toBe(false);
    });

    it('returns false for non-existent node ID', () => {
      expect(canViewNode(alice, 'non-existent-id', permState)).toBe(false);
      expect(canViewNode(bob, 'non-existent-id', permState)).toBe(false);
      expect(getAncestorChain('non-existent-id', permState)).toBeNull();
    });

    it('returns false on broken parent link (dangling parentId)', () => {
      const brokenState: PermissionState = {
        nodes: {
          child: {
            id: 'child',
            name: 'Orphan List',
            type: 'list',
            parentId: 'missing-parent',
            position: 0,
            visibility: 'public',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        grants: [],
      };

      expect(getAncestorChain('child', brokenState)).toBeNull();
      expect(canViewNode(alice, 'child', brokenState)).toBe(false);
      expect(canViewNode(bob, 'child', brokenState)).toBe(false);
    });

    it('returns false on cyclic parent hierarchy', () => {
      const cyclicState: PermissionState = {
        nodes: {
          nodeA: {
            id: 'nodeA',
            name: 'A',
            type: 'space',
            parentId: 'nodeB',
            position: 0,
            visibility: 'public',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
          nodeB: {
            id: 'nodeB',
            name: 'B',
            type: 'folder',
            parentId: 'nodeA',
            position: 0,
            visibility: 'public',
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
          },
        },
        grants: [],
      };

      expect(getAncestorChain('nodeA', cyclicState)).toBeNull();
      expect(getAncestorChain('nodeB', cyclicState)).toBeNull();
      expect(canViewNode(alice, 'nodeA', cyclicState)).toBe(false);
      expect(canViewNode(bob, 'nodeA', cyclicState)).toBe(false);
    });
  });

  describe('Core Invariant: Tree Consistency', () => {
    it('invariant holds: no node is visible if any ancestor is invisible', () => {
      // Test across all users and all nodes in seed state
      const users = [alice, bob, carol];
      const allNodeIds = Object.keys(permState.nodes);

      for (const user of users) {
        for (const nodeId of allNodeIds) {
          const isVisible = canViewNode(user, nodeId, permState);
          if (isVisible) {
            const chain = getAncestorChain(nodeId, permState);
            expect(chain).not.toBeNull();
            if (chain) {
              // Every ancestor must be visible
              for (const ancestor of chain) {
                expect(canViewNode(user, ancestor.id, permState)).toBe(true);
              }
            }
          }
        }
      }
    });
  });

  describe('Task Operations & Cross-List Move Authorization', () => {
    it('canMoveTask requires write permissions on both source and target lists', () => {
      // Bob can access list-1 and list-2, but not list-3
      expect(canMoveTask(bob, 'list-1', 'list-2', permState)).toBe(true);
      expect(canMoveTask(bob, 'list-2', 'list-1', permState)).toBe(true);

      // Moving to or from list-3 fails for Bob
      expect(canMoveTask(bob, 'list-1', 'list-3', permState)).toBe(false);
      expect(canMoveTask(bob, 'list-3', 'list-1', permState)).toBe(false);

      // Carol can access list-1 and list-3, but not list-2
      expect(canMoveTask(carol, 'list-1', 'list-3', permState)).toBe(true);
      expect(canMoveTask(carol, 'list-3', 'list-1', permState)).toBe(true);
      expect(canMoveTask(carol, 'list-1', 'list-2', permState)).toBe(false);
      expect(canMoveTask(carol, 'list-2', 'list-3', permState)).toBe(false);

      // Alice (admin) can move between all valid lists
      expect(canMoveTask(alice, 'list-1', 'list-2', permState)).toBe(true);
      expect(canMoveTask(alice, 'list-2', 'list-3', permState)).toBe(true);
      expect(canMoveTask(alice, 'list-3', 'list-1', permState)).toBe(true);

      // Moving to or from non-existent lists fails
      expect(canMoveTask(alice, 'list-1', 'invalid-list', permState)).toBe(
        false
      );
      expect(canMoveTask(alice, '', 'list-1', permState)).toBe(false);
    });

    it('canEditTasksInList returns false if target node is not a list', () => {
      // Even if user can view space-1 or folder-1, they cannot edit tasks in them
      expect(canEditTasksInList(alice, 'space-1', permState)).toBe(false);
      expect(canEditTasksInList(alice, 'folder-1', permState)).toBe(false);
    });
  });

  describe('Engine Purity Guarantee', () => {
    it('does not mutate state objects during evaluation (Object.freeze check)', () => {
      const freshSeed = createSeedState();
      const rawPerm = toPermissionState(freshSeed);

      // Deep freeze the nodes and grants
      Object.freeze(rawPerm);
      Object.freeze(rawPerm.nodes);
      for (const node of Object.values(rawPerm.nodes)) {
        Object.freeze(node);
      }
      Object.freeze(rawPerm.grants);
      for (const grant of Object.values(rawPerm.grants)) {
        Object.freeze(grant);
      }

      // Executing functions against frozen structures should not throw and should return consistent results
      expect(() => {
        canViewNode(bob, 'list-1', rawPerm);
        canViewNode(bob, 'list-3', rawPerm);
        canViewNode(carol, 'list-2', rawPerm);
        canMoveTask(bob, 'list-1', 'list-2', rawPerm);
        getAncestorChain('list-3', rawPerm);
      }).not.toThrow();

      expect(canViewNode(bob, 'list-1', rawPerm)).toBe(true);
      expect(canViewNode(bob, 'list-3', rawPerm)).toBe(false);
    });
  });
});
