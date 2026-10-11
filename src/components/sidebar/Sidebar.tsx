import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { selectVisibleContainerTree } from '@/domain/selectors';
import { useInitialLoading } from './useInitialLoading';
import { ContainerTree } from './tree';
import { ArchivedSection } from './ArchivedSection';

export const Sidebar: React.FC = () => {
  const state = useFlowboardStore();
  const visibleTree = selectVisibleContainerTree(state);
  const isInitialLoading = useInitialLoading(150);

  return (
    <aside
      className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50/80 shadow-subtle select-none"
      data-testid="sidebar"
    >
      {/* Header with Workspace Brand */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3">
        <span className="text-xs font-bold tracking-tight text-slate-900 uppercase">
          Flowboard
        </span>
        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
          SDE 2
        </span>
      </div>

      {/* Tree Content (isLoading is cosmetic, never gates data!) */}
      <div className="flex-1 overflow-y-auto">
        {isInitialLoading && (
          <div className="space-y-2 p-3" data-testid="tree-skeleton">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="ml-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>
        )}
        <ContainerTree tree={visibleTree} />
      </div>

      {/* Archived Items (Admin only) */}
      <ArchivedSection />
    </aside>
  );
};
