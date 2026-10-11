import React from 'react';
import { Status } from '@/domain/types';
import { getStatusStyles } from '@/domain/statusColors';

export interface StatusBadgeProps {
  status?: Status | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) {
    // Unknown or missing status fallback per F9 Gate 5
    return (
      <span
        data-testid="status-badge-unknown"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Unknown
      </span>
    );
  }

  const styles = getStatusStyles(status.color, status.category);

  return (
    <span
      data-testid={`status-badge-${status.id}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.border} ${styles.bg} ${styles.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {status.name}
    </span>
  );
};
