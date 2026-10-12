import React from 'react';
import { ContainerType } from '@/domain/types';
import { Folder, FolderOpen, ListFilter, Layout } from 'lucide-react';

interface TreeNodeIconProps {
  type: ContainerType;
  isExpanded: boolean;
}

export const TreeNodeIcon: React.FC<TreeNodeIconProps> = ({
  type,
  isExpanded,
}) => {
  if (type === 'workspace') {
    return <Layout className="h-4 w-4 text-slate-700" />;
  }
  if (type === 'space') {
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
    ) : (
      <Folder className="h-3.5 w-3.5 text-indigo-600" />
    );
  }
  if (type === 'folder') {
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
    ) : (
      <Folder className="h-3.5 w-3.5 text-amber-600" />
    );
  }
  return <ListFilter className="h-3.5 w-3.5 text-slate-500" />;
};
