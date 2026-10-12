import { describe, it, expect } from 'vitest';
import { getVisibleTreeNodes, getNextFocusId } from '@/domain/treeKeyboardNav';
import { TreeNode } from '@/domain/selectors';

describe('Tree keyboard navigation pure domain algorithm (F11)', () => {
  // Mock tree structure:
  // - ws-1 (workspace)
  //   - space-1 (space)
  //     - list-1 (list)
  //     - list-2 (list)
  //   - space-2 (space, empty)
  const mockTree: TreeNode[] = [
    {
      id: 'ws-1',
      name: 'Engineering Workspace',
      type: 'workspace',
      visibility: 'public',
      parentId: null,
      position: 0,
      children: [
        {
          id: 'space-1',
          name: 'Backend Space',
          type: 'space',
          visibility: 'public',
          parentId: 'ws-1',
          position: 0,
          children: [
            {
              id: 'list-1',
              name: 'Sprint 1',
              type: 'list',
              visibility: 'public',
              parentId: 'space-1',
              position: 0,
              children: [],
            },
            {
              id: 'list-2',
              name: 'Sprint 2',
              type: 'list',
              visibility: 'public',
              parentId: 'space-1',
              position: 1,
              children: [],
            },
          ],
        },
        {
          id: 'space-2',
          name: 'Frontend Space',
          type: 'space',
          visibility: 'public',
          parentId: 'ws-1',
          position: 1,
          children: [],
        },
      ],
    },
  ];

  it('getVisibleTreeNodes flattens visible nodes respecting expanded/collapsed state', () => {
    // All expanded
    const allExpanded = new Set(['ws-1', 'space-1', 'space-2']);
    const visible = getVisibleTreeNodes(mockTree, allExpanded);
    expect(visible.map((n) => n.id)).toEqual([
      'ws-1',
      'space-1',
      'list-1',
      'list-2',
      'space-2',
    ]);

    // Space-1 collapsed
    const space1Collapsed = new Set(['ws-1', 'space-2']);
    const visibleCollapsed = getVisibleTreeNodes(mockTree, space1Collapsed);
    expect(visibleCollapsed.map((n) => n.id)).toEqual([
      'ws-1',
      'space-1',
      'space-2',
    ]);
  });

  describe('getNextFocusId key handling', () => {
    const allExpanded = new Set(['ws-1', 'space-1', 'space-2']);
    const visible = getVisibleTreeNodes(mockTree, allExpanded);

    it('handles empty visible nodes gracefully', () => {
      expect(getNextFocusId([], null, 'ArrowDown')).toEqual({
        nextFocusId: null,
      });
      expect(getNextFocusId([], 'non-existent', 'Enter')).toEqual({
        nextFocusId: null,
      });
    });

    it('ArrowDown moves down across visible items and clamps at bottom', () => {
      expect(getNextFocusId(visible, 'ws-1', 'ArrowDown')).toEqual({
        nextFocusId: 'space-1',
      });
      expect(getNextFocusId(visible, 'space-1', 'ArrowDown')).toEqual({
        nextFocusId: 'list-1',
      });
      expect(getNextFocusId(visible, 'list-1', 'ArrowDown')).toEqual({
        nextFocusId: 'list-2',
      });
      expect(getNextFocusId(visible, 'list-2', 'ArrowDown')).toEqual({
        nextFocusId: 'space-2',
      });
      // Clamps at last node
      expect(getNextFocusId(visible, 'space-2', 'ArrowDown')).toEqual({
        nextFocusId: 'space-2',
      });
    });

    it('ArrowUp moves up across visible items and clamps at top', () => {
      expect(getNextFocusId(visible, 'space-2', 'ArrowUp')).toEqual({
        nextFocusId: 'list-2',
      });
      expect(getNextFocusId(visible, 'list-2', 'ArrowUp')).toEqual({
        nextFocusId: 'list-1',
      });
      expect(getNextFocusId(visible, 'list-1', 'ArrowUp')).toEqual({
        nextFocusId: 'space-1',
      });
      expect(getNextFocusId(visible, 'space-1', 'ArrowUp')).toEqual({
        nextFocusId: 'ws-1',
      });
      // Clamps at first node
      expect(getNextFocusId(visible, 'ws-1', 'ArrowUp')).toEqual({
        nextFocusId: 'ws-1',
      });
    });

    it('Home and End jump to start and end of visible nodes', () => {
      expect(getNextFocusId(visible, 'list-1', 'Home')).toEqual({
        nextFocusId: 'ws-1',
      });
      expect(getNextFocusId(visible, 'list-1', 'End')).toEqual({
        nextFocusId: 'space-2',
      });
    });

    it('ArrowRight expands collapsed container, or moves to first child if expanded', () => {
      // Space-1 collapsed: Right expands it
      const collapsedVisible = getVisibleTreeNodes(mockTree, new Set(['ws-1']));
      expect(getNextFocusId(collapsedVisible, 'space-1', 'ArrowRight')).toEqual(
        {
          nextFocusId: 'space-1',
          expandNodeId: 'space-1',
        }
      );

      // Space-1 expanded: Right moves to first child (list-1)
      expect(getNextFocusId(visible, 'space-1', 'ArrowRight')).toEqual({
        nextFocusId: 'list-1',
      });

      // List-1 is a list (leaf): Right stays on list-1
      expect(getNextFocusId(visible, 'list-1', 'ArrowRight')).toEqual({
        nextFocusId: 'list-1',
      });
    });

    it('ArrowLeft collapses expanded container, or moves to parent if collapsed/leaf', () => {
      // Space-1 is expanded: Left collapses it
      expect(getNextFocusId(visible, 'space-1', 'ArrowLeft')).toEqual({
        nextFocusId: 'space-1',
        collapseNodeId: 'space-1',
      });

      // List-1 is a leaf: Left moves to parent (space-1)
      expect(getNextFocusId(visible, 'list-1', 'ArrowLeft')).toEqual({
        nextFocusId: 'space-1',
      });

      // Space-1 collapsed: Left moves to parent (ws-1)
      const collapsedVisible = getVisibleTreeNodes(mockTree, new Set(['ws-1']));
      expect(getNextFocusId(collapsedVisible, 'space-1', 'ArrowLeft')).toEqual({
        nextFocusId: 'ws-1',
      });

      // Root ws-1 collapsed: Left stays on ws-1
      const rootOnlyVisible = getVisibleTreeNodes(mockTree, new Set());
      expect(getNextFocusId(rootOnlyVisible, 'ws-1', 'ArrowLeft')).toEqual({
        nextFocusId: 'ws-1',
      });
    });

    it('Enter selects list node or toggles expansion for container node', () => {
      // Enter on list-1: selects list
      expect(getNextFocusId(visible, 'list-1', 'Enter')).toEqual({
        nextFocusId: 'list-1',
        selectListId: 'list-1',
      });

      // Enter on expanded space-1: collapses
      expect(getNextFocusId(visible, 'space-1', 'Enter')).toEqual({
        nextFocusId: 'space-1',
        collapseNodeId: 'space-1',
      });

      // Enter on collapsed space-1: expands
      const collapsedVisible = getVisibleTreeNodes(mockTree, new Set(['ws-1']));
      expect(getNextFocusId(collapsedVisible, 'space-1', 'Enter')).toEqual({
        nextFocusId: 'space-1',
        expandNodeId: 'space-1',
      });
    });
  });
});
