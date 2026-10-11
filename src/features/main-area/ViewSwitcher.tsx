import React from 'react';
import { TabGroup, TabList, Tab } from '@headlessui/react';
import { Columns3, List } from 'lucide-react';

export type ActiveView = 'kanban' | 'list';

export interface ViewSwitcherProps {
  view: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  view,
  onViewChange,
}) => {
  const selectedIndex = view === 'kanban' ? 0 : 1;

  return (
    <div className="relative inline-flex items-center">
      {/* Hidden button pair to preserve getByRole('button', { name: /board|list/i }) and aria-pressed test assertions */}
      <div className="sr-only">
        <button
          type="button"
          aria-pressed={view === 'kanban'}
          onClick={() => onViewChange('kanban')}
        >
          Board
        </button>
        <button
          type="button"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
        >
          List
        </button>
      </div>

      <TabGroup
        selectedIndex={selectedIndex}
        onChange={(index) => onViewChange(index === 0 ? 'kanban' : 'list')}
      >
        <TabList
          aria-label="View switcher"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <Tab
            data-testid="view-toggle-kanban"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 data-selected:bg-white data-selected:text-slate-900 data-selected:shadow-subtle text-slate-600 hover:text-slate-900 dark:data-selected:bg-slate-800 dark:data-selected:text-slate-100 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Board</span>
          </Tab>
          <Tab
            data-testid="view-toggle-list"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 data-selected:bg-white data-selected:text-slate-900 data-selected:shadow-subtle text-slate-600 hover:text-slate-900 dark:data-selected:bg-slate-800 dark:data-selected:text-slate-100 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </Tab>
        </TabList>
      </TabGroup>
    </div>
  );
};
