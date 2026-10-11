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
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
      <ol className="flex items-center gap-1.5 text-xs text-slate-500">
        {crumbs.map((crumb, index) => {
          const isLeaf = index === crumbs.length - 1;

          return (
            <li
              key={crumb.id}
              className="flex items-center gap-1.5"
              data-testid={`breadcrumb-item-${crumb.id}`}
            >
              {index > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLeaf ? (
                <span
                  aria-current="page"
                  className="font-semibold text-slate-900 truncate max-w-[200px]"
                >
                  {crumb.name}
                </span>
              ) : (
                <span className="text-slate-600 truncate max-w-[150px]">
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
