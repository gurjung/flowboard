import React from 'react';
import { Task } from '@/domain/types';
import { PriorityBadge } from '@/components/tasks';

interface PriorityFieldProps {
  priority: Task['priority'];
  canEdit: boolean;
  onChange: (priority: Task['priority']) => void;
}

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
];

export const PriorityField: React.FC<PriorityFieldProps> = ({
  priority,
  canEdit,
  onChange,
}) => {
  if (!canEdit) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-24">
          Priority
        </span>
        <PriorityBadge priority={priority} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="drawer-priority-select"
        className="text-xs font-medium text-slate-500 w-24"
      >
        Priority
      </label>
      <select
        id="drawer-priority-select"
        data-testid="drawer-priority-select"
        value={priority}
        onChange={(e) => onChange(e.target.value as Task['priority'])}
        className="text-xs font-medium rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
