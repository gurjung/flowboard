import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { selectBreadcrumbs } from '@/domain/selectors';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const state = useFlowboardStore();
  const crumbs = selectBreadcrumbs(state);

  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="breadcrumbs"
      className="min-w-0 flex-1 overflow-hidden"
    >
      <ol className="flex min-w-0 flex-nowrap items-center gap-1.5 text-xs text-slate-500 overflow-hidden dark:text-slate-400">
        {crumbs.map((crumb, index) => {
          const isLeaf = index === crumbs.length - 1;

          return (
            <li
              key={crumb.id}
              className="flex min-w-0 shrink items-center gap-1.5"
              data-testid={`breadcrumb-item-${crumb.id}`}
            >
              {index > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-slate-400 shrink-0 dark:text-slate-500"
                  aria-hidden="true"
                />
              )}
              {isLeaf ? (
                <span
                  aria-current="page"
                  className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px] dark:text-slate-100"
                >
                  {crumb.name}
                </span>
              ) : (
                <span className="text-slate-600 truncate max-w-[90px] sm:max-w-[140px] dark:text-slate-300">
                  {crumb.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
