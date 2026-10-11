import React from 'react';
import { TaskPriority } from '@/domain/types';

const PRIORITY_STYLES: Record<
  TaskPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  none: {
    label: 'None',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const info = PRIORITY_STYLES[priority] || PRIORITY_STYLES.none;

  return (
    <span
      data-testid="priority-badge"
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${info.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
      {info.label}
    </span>
  );
};
