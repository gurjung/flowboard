import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { TreeNode, getChildType } from '@/domain/selectors';
import { BaseContainer } from '@/domain/types';
import { canManageContainers } from '@/domain/permissions';
import { DEPTH_PADDING } from './treeConstants';
import { NodeActionMenu } from './NodeActionMenu';
import { EmptyContainerState } from './EmptyContainerState';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  ListFilter,
  Layout,
  Lock,
} from 'lucide-react';

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  siblings: TreeNode[];
  expandedNodeIds: Set<string>;
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
  const hasChildren = node.children.length > 0;
  const paddingClass = DEPTH_PADDING[depth] ?? 'pl-10';

  // Find index among active siblings
  const currentIndex = siblings.findIndex((s) => s.id === node.id);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === siblings.length - 1;

  const handleRowClick = () => {
    if (node.type === 'list') {
      selectList(node.id);
    } else {
      onToggleExpand(node.id);
    }
  };

  const getNodeIcon = () => {
    if (node.type === 'workspace')
      return <Layout className="h-4 w-4 text-slate-700" />;
    if (node.type === 'space') {
      return isExpanded ? (
        <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
      ) : (
        <Folder className="h-3.5 w-3.5 text-indigo-600" />
      );
    }
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
      ) : (
        <Folder className="h-3.5 w-3.5 text-amber-600" />
      );
    }
    return <ListFilter className="h-3.5 w-3.5 text-slate-500" />;
  };

  const childType = getChildType(node.type);

  return (
    <div className="group select-none">
      <div
        data-testid={`tree-row-${node.id}`}
        onClick={handleRowClick}
        className={`flex cursor-pointer items-center justify-between rounded py-1 pr-1.5 text-xs transition-colors ${paddingClass} ${
          isSelected
            ? 'border-l-2 border-indigo-600 bg-indigo-50/80 font-semibold text-indigo-900'
            : 'text-slate-700 hover:bg-slate-200/50'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate py-0.5">
          {node.type !== 'list' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="flex h-4 w-4 items-center justify-center text-slate-400 hover:text-slate-700"
              data-testid={`toggle-expand-${node.id}`}
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

          <span className="shrink-0">{getNodeIcon()}</span>

          <span className="truncate font-medium" title={node.name}>
            {node.name}
          </span>

          {node.visibility === 'private' && (
            <span title="Private container" className="shrink-0">
              <Lock className="h-3 w-3 text-amber-600" />
            </span>
          )}
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
