import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { UserSwitcher } from './UserSwitcher';
import { ThemeSelector } from './ThemeSelector';
import { useSidebar } from '@/components/layout';
import { PanelLeft } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggleSidebar,
    toggleButtonRef,
  } = useSidebar();

  const isExpanded = isMobile ? isMobileOpen : !isCollapsed;

  return (
    <header
      className="flex h-12 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 select-none transition-colors dark:border-slate-800 dark:bg-slate-900"
      data-testid="top-bar"
    >
      <div className="flex flex-1 min-w-0 items-center overflow-hidden mr-4">
        <button
          ref={toggleButtonRef}
          type="button"
          data-testid="sidebar-toggle-btn"
          aria-expanded={isExpanded}
          aria-controls="sidebar"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={toggleSidebar}
          className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <Breadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeSelector />
        <UserSwitcher />
      </div>
    </header>
  );
};
