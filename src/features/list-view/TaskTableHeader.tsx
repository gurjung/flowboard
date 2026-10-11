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
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-brand-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-brand-600" />
    );
  };

  return (
    <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
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
          onClick={() => onSortChange('priority')}
          className="px-3 py-3 w-28 cursor-pointer select-none hover:bg-slate-100 transition-colors"
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
          onClick={() => onSortChange('dueDate')}
          className="px-3 py-3 w-32 cursor-pointer select-none hover:bg-slate-100 transition-colors"
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
