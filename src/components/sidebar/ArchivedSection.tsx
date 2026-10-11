import React, { useState } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { canManageContainers } from '@/domain/permissions';
import { selectArchivedRoots } from '@/domain/selectors';
import {
  Archive,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const ArchivedSection: React.FC = () => {
  const state = useFlowboardStore();
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const users = useFlowboardStore((s) => s.users);
  const restoreContainer = useFlowboardStore((s) => s.restoreContainer);

  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentUser = users[currentUserId];
  const isAdmin = canManageContainers(currentUser);

  // Admin-only section (D-028)
  if (!isAdmin) {
    return null;
  }

  // selectArchivedRoots lists archived nodes whose ancestors are all active (D-028)
  const archivedRoots = selectArchivedRoots(state);

  const handleRestore = async (id: string) => {
    setErrorMsg(null);
    const result = await restoreContainer(id);
    if (!result.success) {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <div
      className="border-t border-slate-200 bg-slate-50/70 p-2 text-xs"
      data-testid="archived-section"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded px-2 py-1 text-slate-600 hover:bg-slate-200/60"
        data-testid="toggle-archived-section"
      >
        <div className="flex items-center gap-1.5 font-medium">
          <Archive className="h-3.5 w-3.5 text-slate-500" />
          <span>Archived Items ({archivedRoots.length})</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {errorMsg && (
            <div
              className="flex items-center gap-1 rounded bg-rose-50 p-1.5 text-[11px] text-rose-700"
              data-testid="archived-error"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {archivedRoots.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-slate-400 italic">
              No archived containers
            </p>
          ) : (
            archivedRoots.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-1 shadow-2xs"
                data-testid={`archived-item-${node.id}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="truncate font-medium text-slate-700"
                    title={node.name}
                  >
                    {node.name}
                    <span className="ml-1.5 text-[10px] text-slate-400 uppercase tracking-wider">
                      {node.type}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(node.id)}
                  data-testid={`restore-btn-${node.id}`}
                  title="Restore container"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
