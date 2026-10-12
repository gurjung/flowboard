import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { TreeNode, getChildType } from '@/domain/selectors';
import { BaseContainer } from '@/domain/types';
import { canManageContainers } from '@/domain/permissions';
import { DEPTH_PADDING } from './treeConstants';
import { NodeActionMenu } from './NodeActionMenu';
import { EmptyContainerState } from './EmptyContainerState';
import { TreeNodeContent } from './TreeNodeContent';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/toasts';

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  siblings: TreeNode[];
  expandedNodeIds: Set<string>;
  focusedId: string | null;
  onFocusNode: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onOpenCreate: (node: BaseContainer) => void;
  onOpenRename: (node: BaseContainer) => void;
  onOpenArchive: (node: BaseContainer) => void;
}

export const TreeRow: React.FC<TreeRowProps> = ({
  node,
  depth,
  siblings,
  expandedNodeIds,
  focusedId,
  onFocusNode,
  onToggleExpand,
  onOpenCreate,
  onOpenRename,
  onOpenArchive,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const users = useFlowboardStore((s) => s.users);
  const selectedListId = useFlowboardStore((s) => s.selectedListId);
  const selectList = useFlowboardStore((s) => s.selectList);
  const reorderContainer = useFlowboardStore((s) => s.reorderContainer);

  const currentUser = users[currentUserId];
  const isAdmin = canManageContainers(currentUser);

  const isExpanded = expandedNodeIds.has(node.id);
  const isSelected = node.type === 'list' && selectedListId === node.id;
  const isFocused = focusedId === node.id;
  const hasChildren = node.children.length > 0;
  const paddingClass = DEPTH_PADDING[depth] ?? 'pl-10';

  const currentIndex = siblings.findIndex((s) => s.id === node.id);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === siblings.length - 1;

  const toast = useToast();

  const handleRowClick = () => {
    onFocusNode(node.id);
    if (node.type === 'list') {
      const result = selectList(node.id);
      if (!result.success) {
        toast.error(result.error.message);
      }
    } else {
      onToggleExpand(node.id);
    }
  };

  const childType = getChildType(node.type);

  return (
    <div className="group select-none">
      <div
        role="treeitem"
        data-testid={`tree-row-${node.id}`}
        data-node-id={node.id}
        tabIndex={isFocused ? 0 : -1}
        aria-expanded={node.type !== 'list' ? isExpanded : undefined}
        aria-selected={node.type === 'list' ? isSelected : undefined}
        onClick={handleRowClick}
        onFocus={() => onFocusNode(node.id)}
        className={`flex cursor-pointer items-center justify-between rounded py-1 pr-1.5 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${paddingClass} ${
          isSelected
            ? 'border-l-2 border-indigo-600 bg-indigo-50/80 font-semibold text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200'
            : 'text-slate-700 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate py-0.5">
          {node.type !== 'list' ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="flex h-4 w-4 items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-hidden dark:hover:text-slate-200"
              data-testid={`toggle-expand-${node.id}`}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <TreeNodeContent node={node} isExpanded={isExpanded} />
        </div>

        {/* Action Menu (Admin only via canManageContainers) */}
        {isAdmin && (
          <NodeActionMenu
            node={node}
            childType={childType}
            currentIndex={currentIndex}
            isFirst={isFirst}
            isLast={isLast}
            reorderContainer={reorderContainer}
            onOpenCreate={() => onOpenCreate(node as unknown as BaseContainer)}
            onOpenRename={() => onOpenRename(node as unknown as BaseContainer)}
            onOpenArchive={() =>
              onOpenArchive(node as unknown as BaseContainer)
            }
          />
        )}
      </div>

      {/* Children or Empty State */}
      {node.type !== 'list' && isExpanded && (
        <div className="space-y-0.5">
          {hasChildren ? (
            node.children.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                siblings={node.children}
                expandedNodeIds={expandedNodeIds}
                focusedId={focusedId}
                onFocusNode={onFocusNode}
                onToggleExpand={onToggleExpand}
                onOpenCreate={onOpenCreate}
                onOpenRename={onOpenRename}
                onOpenArchive={onOpenArchive}
              />
            ))
          ) : (
            <EmptyContainerState
              nodeId={node.id}
              childType={childType}
              depth={depth + 1}
              isAdmin={isAdmin}
              onOpenCreate={() =>
                onOpenCreate(node as unknown as BaseContainer)
              }
            />
          )}
        </div>
      )}
    </div>
  );
};
