import React from 'react';
import { SortConfig, SortKey } from '@/domain/taskSorting';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export interface TaskTableHeaderProps {
  sortConfig: SortConfig | null;
  onSortChange: (key: SortKey) => void;
}

export const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({
  sortConfig,
  onSortChange,
}) => {
  const getAriaSort = (key: SortKey): 'ascending' | 'descending' | 'none' => {
    if (!sortConfig || sortConfig.key !== key) return 'none';
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  };

  const renderSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <ArrowUpDown className="h-3 w-3 text-slate-400 dark:text-slate-500 opacity-60" />
      );
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
    );
  };

  return (
    <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 border-b border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-800">
      <tr>
        <th scope="col" data-testid="th-title" className="py-3 pl-4 pr-3">
          Title
        </th>
        <th scope="col" data-testid="th-status" className="px-3 py-3 w-36">
          Status
        </th>
        <th
          scope="col"
          data-testid="th-priority"
          aria-sort={getAriaSort('priority')}
          tabIndex={0}
          onClick={() => onSortChange('priority')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSortChange('priority');
            }
          }}
          className="px-3 py-3 w-28 cursor-pointer select-none rounded hover:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 active:bg-slate-200 dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-900 dark:active:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <span>Priority</span>
            {renderSortIcon('priority')}
          </div>
        </th>
        <th
          scope="col"
          data-testid="th-dueDate"
          aria-sort={getAriaSort('dueDate')}
          tabIndex={0}
          onClick={() => onSortChange('dueDate')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSortChange('dueDate');
            }
          }}
          className="px-3 py-3 w-32 cursor-pointer select-none rounded hover:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 active:bg-slate-200 dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-900 dark:active:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <span>Due date</span>
            {renderSortIcon('dueDate')}
          </div>
        </th>
        <th
          scope="col"
          data-testid="th-assignees"
          className="py-3 pl-3 pr-3 w-28"
        >
          Assignees
        </th>
        <th
          scope="col"
          data-testid="th-actions"
          className="py-3 pl-2 pr-4 w-12 text-right"
        >
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
};
