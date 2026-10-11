import React from 'react';
import { TreeNode } from '@/domain/selectors';
import { TreeNodeIcon } from './TreeNodeIcon';
import { Lock } from 'lucide-react';

interface TreeNodeContentProps {
  node: TreeNode;
  isExpanded: boolean;
}

export const TreeNodeContent: React.FC<TreeNodeContentProps> = ({
  node,
  isExpanded,
}) => {
  return (
    <>
      <span className="shrink-0">
        <TreeNodeIcon type={node.type} isExpanded={isExpanded} />
      </span>
      <span className="truncate font-medium" title={node.name}>
        {node.name}
      </span>
      {node.visibility === 'private' && (
        <span title="Private container" className="shrink-0">
          <Lock className="h-3 w-3 text-amber-600 dark:text-amber-500" />
        </span>
      )}
    </>
  );
};
