import React, { useState } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { TreeNode } from '@/domain/selectors';
import { BaseContainer } from '@/domain/types';
import { useToast } from '@/components/toasts';
import { TreeRow } from './TreeNodeRow';
import { useTreeKeyboardNav } from './useTreeKeyboardNav';
import {
  CreateContainerDialog,
  RenameContainerDialog,
  ArchiveConfirmDialog,
} from '../dialogs';

interface ContainerTreeProps {
  tree: TreeNode[];
}

export const ContainerTree: React.FC<ContainerTreeProps> = ({ tree }) => {
  // Ephemeral accordion state: expand all non-empty nodes by default
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    function collect(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.type !== 'list') {
          ids.add(n.id);
          collect(n.children);
        }
      }
    }
    collect(tree);
    return ids;
  });

  const selectList = useFlowboardStore((s) => s.selectList);
  const toast = useToast();

  const handleSelectNode = (id: string) => {
    const result = selectList(id);
    if (!result.success) {
      toast.error(result.error.message);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const { focusedId, setFocusedId, handleKeyDown } = useTreeKeyboardNav({
    tree,
    expandedNodeIds,
    onToggleExpand: toggleExpand,
    onSelectNode: handleSelectNode,
  });

  // Modal dialog states
  const [createParent, setCreateParent] = useState<BaseContainer | null>(null);
  const [renameTarget, setRenameTarget] = useState<BaseContainer | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<BaseContainer | null>(
    null
  );

  const handleCreateSuccess = (parentId: string) => {
    // D-024: Auto-expand parent upon successful creation
    setExpandedNodeIds((prev) => new Set(prev).add(parentId));
  };

  return (
    <div
      role="tree"
      aria-label="Container hierarchy"
      onKeyDown={handleKeyDown}
      className="space-y-0.5 p-2 focus:outline-hidden"
      data-testid="container-tree"
    >
      {tree.map((rootNode) => (
        <TreeRow
          key={rootNode.id}
          node={rootNode}
          depth={0}
          siblings={tree}
          expandedNodeIds={expandedNodeIds}
          focusedId={focusedId}
          onFocusNode={setFocusedId}
          onToggleExpand={toggleExpand}
          onOpenCreate={setCreateParent}
          onOpenRename={setRenameTarget}
          onOpenArchive={setArchiveTarget}
        />
      ))}

      {createParent && (
        <CreateContainerDialog
          parentNode={createParent}
          isOpen={true}
          onClose={() => setCreateParent(null)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {renameTarget && (
        <RenameContainerDialog
          node={renameTarget}
          isOpen={true}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {archiveTarget && (
        <ArchiveConfirmDialog
          node={archiveTarget}
          isOpen={true}
          onClose={() => setArchiveTarget(null)}
        />
      )}
    </div>
  );
};
