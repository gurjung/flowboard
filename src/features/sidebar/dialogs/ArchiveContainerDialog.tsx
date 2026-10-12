import React, { useState, useEffect, useRef } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { BaseContainer } from '@/domain/types';
import { getDescendantCounts } from '@/domain/selectors';
import { Modal } from '@/components/common';

interface ArchiveConfirmProps {
  node: BaseContainer;
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveConfirmDialog: React.FC<ArchiveConfirmProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const archiveContainer = useFlowboardStore((s) => s.archiveContainer);
  const storeState = useFlowboardStore.getState();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isOpen) return null;

  // D-025 / D-028: Archive dialog states active descendant containers AND tasks hidden (both counts!)
  const { containerCount, taskCount } = getDescendantCounts(
    node.id,
    storeState
  );

  const handleConfirm = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    const callUserId = currentUserId;
    const result = await archiveContainer(node.id);

    if (
      !isMountedRef.current ||
      callUserId !== useFlowboardStore.getState().currentUserId
    ) {
      return;
    }

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Archive ${node.name}`}
      testId="archive-confirm-dialog"
      errorMsg={errorMsg}
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to archive <strong>{node.name}</strong>?
        </p>

        <div
          className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
          data-testid="archive-descendant-warning"
        >
          <p className="font-medium">Impact of archiving:</p>
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>
              <strong>{containerCount}</strong> active descendant container
              {containerCount === 1 ? '' : 's'} will be hidden.
            </li>
            <li>
              <strong>{taskCount}</strong> active task
              {taskCount === 1 ? '' : 's'} will be hidden.
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            data-testid="archive-confirm-btn"
            className="rounded bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors dark:bg-rose-600 dark:hover:bg-rose-700"
          >
            {isSubmitting ? 'Archiving...' : 'Archive Container'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
