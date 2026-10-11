import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { selectVisibleContainerTree } from '@/domain/selectors';
import { useSidebar } from '@/components/layout';
import { useInitialLoading } from './useInitialLoading';
import { ContainerTree } from './tree';
import { ArchivedSection } from './ArchivedSection';

export const Sidebar: React.FC = () => {
  const state = useFlowboardStore();
  const visibleTree = selectVisibleContainerTree(state);
  const isInitialLoading = useInitialLoading(150);

  const { isCollapsed, isMobile, isMobileOpen, closeMobileSidebar } =
    useSidebar();

  const isInert = isMobile ? !isMobileOpen : isCollapsed;

  const asideClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 shadow-xl transition-transform duration-300 ease-in-out select-none dark:border-slate-800 dark:bg-slate-900 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`
    : `relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width,border-color] duration-300 ease-in-out select-none dark:border-slate-800 dark:bg-slate-900 ${
        isCollapsed
          ? 'w-0 !border-r-transparent pointer-events-none'
          : 'w-64 shadow-subtle'
      }`;

  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          data-testid="sidebar-backdrop"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        id="sidebar"
        data-testid="sidebar"
        aria-label="Sidebar navigation"
        inert={isInert ? '' : undefined}
        aria-hidden={isInert ? 'true' : 'false'}
        className={asideClasses}
      >
        <div className="flex h-full w-64 shrink-0 flex-col">
          {/* Header with Workspace Brand */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 transition-colors dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold tracking-tight text-slate-900 uppercase dark:text-slate-100">
              Flowboard
            </span>
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              SDE 2
            </span>
          </div>

          {/* Tree Content (isLoading is cosmetic, never gates data!) */}
          <div className="flex-1 overflow-y-auto">
            {isInitialLoading && (
              <div className="space-y-2 p-3" data-testid="tree-skeleton">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="ml-3 h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            )}
            <ContainerTree tree={visibleTree} />
          </div>

          {/* Archived Items (Admin only) */}
          <ArchivedSection />
        </div>
      </aside>
    </>
  );
};
