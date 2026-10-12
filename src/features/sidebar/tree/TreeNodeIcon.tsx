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
    return <Layout className="h-4 w-4 text-slate-700 dark:text-slate-300" />;
  }
  if (type === 'space') {
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <Folder className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
    );
  }
  if (type === 'folder') {
    return isExpanded ? (
      <FolderOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
    ) : (
      <Folder className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
    );
  }
  return (
    <ListFilter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
  );
};
