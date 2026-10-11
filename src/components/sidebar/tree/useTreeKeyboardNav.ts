import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TreeNode } from '@/domain/selectors';
import {
  getVisibleTreeNodes,
  getNextFocusId,
  TreeNavKey,
} from '@/domain/treeKeyboardNav';

export interface UseTreeKeyboardNavProps {
  tree: TreeNode[];
  expandedNodeIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectNode?: (id: string) => void;
}

export function useTreeKeyboardNav({
  tree,
  expandedNodeIds,
  onToggleExpand,
  onSelectNode,
}: UseTreeKeyboardNavProps) {
  const visibleNodes = useMemo(
    () => getVisibleTreeNodes(tree, expandedNodeIds),
    [tree, expandedNodeIds]
  );

  const [focusedId, setFocusedId] = useState<string | null>(() => {
    return visibleNodes[0]?.id ?? null;
  });

  // Fallback: If focused node disappears (deleted/archived/collapsed), focus first visible item
  useEffect(() => {
    if (visibleNodes.length === 0) {
      setFocusedId(null);
      return;
    }
    const exists = visibleNodes.some((n) => n.id === focusedId);
    if (!exists) {
      setFocusedId(visibleNodes[0]?.id ?? null);
    }
  }, [visibleNodes, focusedId]);

  // When focusedId changes and activeElement is within the tree, focus the corresponding element
  useEffect(() => {
    if (focusedId) {
      const el = document.querySelector<HTMLElement>(
        `[data-node-id="${focusedId}"]`
      );
      if (
        el &&
        document.activeElement !== el &&
        document.activeElement?.closest('[role="tree"]')
      ) {
        el.focus();
      }
    }
  }, [focusedId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const navKeys = [
        'ArrowDown',
        'ArrowUp',
        'ArrowRight',
        'ArrowLeft',
        'Home',
        'End',
        'Enter',
      ];
      if (!navKeys.includes(e.key)) {
        return;
      }

      // Do not intercept Enter if target is an interactive button inside the row
      if (
        e.key === 'Enter' &&
        (e.target as HTMLElement)?.tagName === 'BUTTON'
      ) {
        return;
      }

      e.preventDefault();
      const res = getNextFocusId(visibleNodes, focusedId, e.key as TreeNavKey);

      if (res.nextFocusId) {
        setFocusedId(res.nextFocusId);
      }
      if (res.expandNodeId) {
        if (!expandedNodeIds.has(res.expandNodeId)) {
          onToggleExpand(res.expandNodeId);
        }
      }
      if (res.collapseNodeId) {
        if (expandedNodeIds.has(res.collapseNodeId)) {
          onToggleExpand(res.collapseNodeId);
        }
      }
      if (res.selectListId) {
        onSelectNode?.(res.selectListId);
      }
    },
    [visibleNodes, focusedId, expandedNodeIds, onToggleExpand, onSelectNode]
  );

  return {
    focusedId,
    setFocusedId,
    handleKeyDown,
    visibleNodes,
  };
}
