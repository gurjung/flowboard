import { TreeNode } from './selectors';

export interface VisibleTreeNode {
  id: string;
  type: TreeNode['type'];
  name: string;
  parentId: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
  childIds: string[];
}

export interface TreeNavResult {
  nextFocusId: string | null;
  expandNodeId?: string;
  collapseNodeId?: string;
  selectListId?: string;
}

export type TreeNavKey =
  | 'ArrowDown'
  | 'ArrowUp'
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'Home'
  | 'End'
  | 'Enter';

/**
 * Flattens the visible tree nodes in pre-order depth-first traversal,
 * respecting expanded/collapsed state.
 */
export function getVisibleTreeNodes(
  tree: TreeNode[],
  expandedNodeIds: Set<string>,
  parentId: string | null = null
): VisibleTreeNode[] {
  const result: VisibleTreeNode[] = [];

  for (const node of tree) {
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.children.length > 0;

    result.push({
      id: node.id,
      type: node.type,
      name: node.name,
      parentId,
      hasChildren,
      isExpanded,
      childIds: node.children.map((c) => c.id),
    });

    if (node.type !== 'list' && isExpanded && hasChildren) {
      result.push(
        ...getVisibleTreeNodes(node.children, expandedNodeIds, node.id)
      );
    }
  }

  return result;
}

/**
 * Pure WAI-ARIA tree keyboard navigation resolution algorithm.
 */
export function getNextFocusId(
  visibleNodes: VisibleTreeNode[],
  focusedId: string | null,
  key: TreeNavKey
): TreeNavResult {
  if (visibleNodes.length === 0) {
    return { nextFocusId: null };
  }

  const currentIndex = focusedId
    ? visibleNodes.findIndex((n) => n.id === focusedId)
    : -1;
  const currentNode = currentIndex >= 0 ? visibleNodes[currentIndex] : null;

  switch (key) {
    case 'ArrowDown': {
      if (currentIndex === -1) {
        return { nextFocusId: visibleNodes[0]?.id ?? null };
      }
      const nextIdx = Math.min(currentIndex + 1, visibleNodes.length - 1);
      return { nextFocusId: visibleNodes[nextIdx]?.id ?? null };
    }

    case 'ArrowUp': {
      if (currentIndex === -1) {
        return { nextFocusId: visibleNodes[0]?.id ?? null };
      }
      const prevIdx = Math.max(currentIndex - 1, 0);
      return { nextFocusId: visibleNodes[prevIdx]?.id ?? null };
    }

    case 'Home': {
      return { nextFocusId: visibleNodes[0]?.id ?? null };
    }

    case 'End': {
      return { nextFocusId: visibleNodes[visibleNodes.length - 1]?.id ?? null };
    }

    case 'ArrowRight': {
      if (!currentNode) {
        return { nextFocusId: visibleNodes[0]?.id ?? null };
      }

      // Container node
      if (currentNode.type !== 'list') {
        if (!currentNode.isExpanded) {
          // Collapsed: Right expands the node
          return { nextFocusId: currentNode.id, expandNodeId: currentNode.id };
        }
        // Already expanded: Right moves to first child if present
        if (currentNode.childIds.length > 0) {
          return { nextFocusId: currentNode.childIds[0] ?? currentNode.id };
        }
      }

      // Leaf or list or expanded container with no children
      return { nextFocusId: currentNode.id };
    }

    case 'ArrowLeft': {
      if (!currentNode) {
        return { nextFocusId: visibleNodes[0]?.id ?? null };
      }

      // If container is expanded: Left collapses it
      if (currentNode.type !== 'list' && currentNode.isExpanded) {
        return {
          nextFocusId: currentNode.id,
          collapseNodeId: currentNode.id,
        };
      }

      // If already collapsed or leaf: Left moves to parent
      if (currentNode.parentId) {
        return { nextFocusId: currentNode.parentId };
      }

      // Root node already collapsed: stay on current
      return { nextFocusId: currentNode.id };
    }

    case 'Enter': {
      if (!currentNode) {
        return { nextFocusId: visibleNodes[0]?.id ?? null };
      }

      if (currentNode.type === 'list') {
        return { nextFocusId: currentNode.id, selectListId: currentNode.id };
      }

      // Toggle expand for non-list
      if (currentNode.isExpanded) {
        return {
          nextFocusId: currentNode.id,
          collapseNodeId: currentNode.id,
        };
      }
      return { nextFocusId: currentNode.id, expandNodeId: currentNode.id };
    }

    default:
      return { nextFocusId: currentNode?.id ?? visibleNodes[0]?.id ?? null };
  }
}
