import React from 'react';
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
  return (
    <div
      role="group"
      aria-label="View switcher"
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        type="button"
        data-testid="view-toggle-kanban"
        aria-pressed={view === 'kanban'}
        onClick={() => onViewChange('kanban')}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          view === 'kanban'
            ? 'bg-white text-slate-900 shadow-subtle dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Columns3 className="h-3.5 w-3.5" />
        <span>Board</span>
      </button>

      <button
        type="button"
        data-testid="view-toggle-list"
        aria-pressed={view === 'list'}
        onClick={() => onViewChange('list')}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          view === 'list'
            ? 'bg-white text-slate-900 shadow-subtle dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <List className="h-3.5 w-3.5" />
        <span>List</span>
      </button>
    </div>
  );
};
