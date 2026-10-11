import React from 'react';
import { Plus } from 'lucide-react';
import { ContainerType } from '@/domain/types';
import { DEPTH_PADDING } from './treeConstants';

interface EmptyContainerStateProps {
  nodeId: string;
  childType: ContainerType | null;
  depth: number;
  isAdmin: boolean;
  onOpenCreate: () => void;
}

export const EmptyContainerState: React.FC<EmptyContainerStateProps> = ({
  nodeId,
  childType,
  depth,
  isAdmin,
  onOpenCreate,
}) => {
  const paddingClass = DEPTH_PADDING[depth] ?? 'pl-10';

  return (
    <div
      className={`flex items-center justify-between py-1 pr-2 text-xs text-slate-400 italic ${paddingClass}`}
      data-testid={`empty-state-${nodeId}`}
    >
      {isAdmin ? (
        <>
          <span>No {childType}s yet</span>
          {childType && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium not-italic text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          )}
        </>
      ) : (
        <span>Nothing to show here</span>
      )}
    </div>
  );
};
